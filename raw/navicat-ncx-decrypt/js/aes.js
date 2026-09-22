/* Small, dependency-free AES-128-CBC decryptor for Navicat 12+ NCX files. */
(function (root) {
	"use strict";

	function gfMultiply(a, b) {
		let result = 0;
		for (let i = 0; i < 8; i += 1) {
			if (b & 1) result ^= a;
			const high = a & 0x80;
			a = (a << 1) & 0xff;
			if (high) a ^= 0x1b;
			b >>>= 1;
		}
		return result;
	}

	function gfPow(value, power) {
		let result = 1;
		while (power > 0) {
			if (power & 1) result = gfMultiply(result, value);
			value = gfMultiply(value, value);
			power >>>= 1;
		}
		return result;
	}

	function rotateByte(value, amount) {
		return ((value << amount) | (value >>> (8 - amount))) & 0xff;
	}

	const sbox = new Uint8Array(256);
	const inverseSbox = new Uint8Array(256);
	for (let i = 0; i < 256; i += 1) {
		const inverse = i === 0 ? 0 : gfPow(i, 254);
		const substituted = inverse ^ rotateByte(inverse, 1) ^ rotateByte(inverse, 2) ^ rotateByte(inverse, 3) ^ rotateByte(inverse, 4) ^ 0x63;
		sbox[i] = substituted;
		inverseSbox[substituted] = i;
	}

	function expandKey(key) {
		if (!(key instanceof Uint8Array) || key.length !== 16) throw new Error("AES 密钥必须是 16 字节");
		const expanded = new Uint8Array(176);
		expanded.set(key);
		let offset = 16;
		let rcon = 1;
		const temp = new Uint8Array(4);
		while (offset < expanded.length) {
			temp.set(expanded.slice(offset - 4, offset));
			if (offset % 16 === 0) {
				const first = temp[0];
				temp[0] = sbox[temp[1]] ^ rcon;
				temp[1] = sbox[temp[2]];
				temp[2] = sbox[temp[3]];
				temp[3] = sbox[first];
				rcon = gfMultiply(rcon, 2);
			}
			for (let i = 0; i < 4; i += 1) {
				expanded[offset] = expanded[offset - 16] ^ temp[i];
				offset += 1;
			}
		}
		return expanded;
	}

	function addRoundKey(state, expandedKey, round) {
		const start = round * 16;
		for (let i = 0; i < 16; i += 1) state[i] ^= expandedKey[start + i];
	}

	function inverseShiftRows(state) {
		let t;
		t = state[13]; state[13] = state[9]; state[9] = state[5]; state[5] = state[1]; state[1] = t;
		t = state[2]; state[2] = state[10]; state[10] = t;
		t = state[6]; state[6] = state[14]; state[14] = t;
		t = state[3]; state[3] = state[7]; state[7] = state[11]; state[11] = state[15]; state[15] = t;
	}

	function inverseSubBytes(state) {
		for (let i = 0; i < 16; i += 1) state[i] = inverseSbox[state[i]];
	}

	function inverseMixColumns(state) {
		for (let column = 0; column < 4; column += 1) {
			const i = column * 4;
			const a = state.slice(i, i + 4);
			state[i] = gfMultiply(a[0], 14) ^ gfMultiply(a[1], 11) ^ gfMultiply(a[2], 13) ^ gfMultiply(a[3], 9);
			state[i + 1] = gfMultiply(a[0], 9) ^ gfMultiply(a[1], 14) ^ gfMultiply(a[2], 11) ^ gfMultiply(a[3], 13);
			state[i + 2] = gfMultiply(a[0], 13) ^ gfMultiply(a[1], 9) ^ gfMultiply(a[2], 14) ^ gfMultiply(a[3], 11);
			state[i + 3] = gfMultiply(a[0], 11) ^ gfMultiply(a[1], 13) ^ gfMultiply(a[2], 9) ^ gfMultiply(a[3], 14);
		}
	}

	function decryptBlock(block, expandedKey) {
		const state = new Uint8Array(block);
		addRoundKey(state, expandedKey, 10);
		for (let round = 9; round > 0; round -= 1) {
			inverseShiftRows(state);
			inverseSubBytes(state);
			addRoundKey(state, expandedKey, round);
			inverseMixColumns(state);
		}
		inverseShiftRows(state);
		inverseSubBytes(state);
		addRoundKey(state, expandedKey, 0);
		return state;
	}

	function hexToBytes(hex) {
		const normalized = String(hex || "").trim();
		if (!normalized) return new Uint8Array();
		if (normalized.length % 2 !== 0 || !/^[0-9a-f]+$/i.test(normalized)) throw new Error("密码不是有效的十六进制数据");
		const bytes = new Uint8Array(normalized.length / 2);
		for (let i = 0; i < bytes.length; i += 1) bytes[i] = parseInt(normalized.slice(i * 2, i * 2 + 2), 16);
		return bytes;
	}

	function utf8Bytes(text) {
		if (typeof TextEncoder !== "undefined") return new TextEncoder().encode(text);
		const encoded = unescape(encodeURIComponent(text));
		const bytes = new Uint8Array(encoded.length);
		for (let i = 0; i < encoded.length; i += 1) bytes[i] = encoded.charCodeAt(i);
		return bytes;
	}

	function decodeUtf8(bytes) {
		try {
			if (typeof TextDecoder !== "undefined") return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
			let encoded = "";
			for (let i = 0; i < bytes.length; i += 1) encoded += "%" + bytes[i].toString(16).padStart(2, "0");
			return decodeURIComponent(encoded);
		} catch (_) {
			throw new Error("解密结果不是有效的 UTF-8 文本");
		}
	}

	function decryptAES128CBC(encryptedHex, keyText, ivText) {
		if (!encryptedHex) return "无密码";
		const ciphertext = hexToBytes(encryptedHex);
		const key = utf8Bytes(keyText);
		const iv = utf8Bytes(ivText);
		if (ciphertext.length === 0 || ciphertext.length % 16 !== 0) throw new Error("加密数据长度不是 16 字节的倍数");
		if (iv.length !== 16) throw new Error("AES 向量必须是 16 字节");

		const expandedKey = expandKey(key);
		const plaintext = new Uint8Array(ciphertext.length);
		let previous = iv;
		for (let offset = 0; offset < ciphertext.length; offset += 16) {
			const current = ciphertext.slice(offset, offset + 16);
			const decrypted = decryptBlock(current, expandedKey);
			for (let i = 0; i < 16; i += 1) plaintext[offset + i] = decrypted[i] ^ previous[i];
			previous = current;
		}

		const padding = plaintext[plaintext.length - 1];
		if (padding < 1 || padding > 16) throw new Error("PKCS#7 填充无效，文件版本或密码格式可能不受支持");
		for (let i = plaintext.length - padding; i < plaintext.length; i += 1) {
			if (plaintext[i] !== padding) throw new Error("PKCS#7 填充无效，文件版本或密码格式可能不受支持");
		}
		return decodeUtf8(plaintext.slice(0, plaintext.length - padding));
	}

	root.NavicatCrypto = { decryptAES128CBC, hexToBytes };
})(globalThis);
