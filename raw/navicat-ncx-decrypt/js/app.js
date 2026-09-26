(function () {
	"use strict";

	const AES_KEY = "libcckeylibcckey";
	const AES_IV = "libcciv libcciv ";
	const MAX_FILE_SIZE = 10 * 1024 * 1024;
	let connections = [];
	let toastTimer;

	const $ = (id) => document.getElementById(id);
	const elements = {
		fileTab: $("fileTab"), pasteTab: $("pasteTab"), filePanel: $("filePanel"), pastePanel: $("pastePanel"),
		fileInput: $("fileInput"), chooseFileBtn: $("chooseFileBtn"), dropZone: $("dropZone"), xmlInput: $("xmlInput"),
		parseTextBtn: $("parseTextBtn"), message: $("message"), resultsSection: $("resultsSection"), resultCount: $("resultCount"),
		sourceName: $("sourceName"), searchInput: $("searchInput"), exportBtn: $("exportBtn"), clearBtn: $("clearBtn"),
		connectionList: $("connectionList"), noMatches: $("noMatches"), toast: $("toast")
	};

	function setTab(name) {
		const isFile = name === "file";
		elements.fileTab.classList.toggle("active", isFile);
		elements.pasteTab.classList.toggle("active", !isFile);
		elements.fileTab.setAttribute("aria-selected", String(isFile));
		elements.pasteTab.setAttribute("aria-selected", String(!isFile));
		elements.filePanel.classList.toggle("hidden", !isFile);
		elements.pastePanel.classList.toggle("hidden", isFile);
	}

	function showMessage(text, type) {
		elements.message.textContent = text;
		elements.message.className = "message " + type;
	}

	function hideMessage() {
		elements.message.className = "message hidden";
		elements.message.textContent = "";
	}

	function showToast(text) {
		clearTimeout(toastTimer);
		elements.toast.textContent = text;
		elements.toast.classList.add("show");
		toastTimer = setTimeout(() => elements.toast.classList.remove("show"), 2200);
	}

	function decryptPassword(value) {
		if (!value) return { value: "无密码", error: false };
		try {
			return { value: NavicatCrypto.decryptAES128CBC(value, AES_KEY, AES_IV), error: false };
		} catch (error) {
			return { value: "解密失败：" + error.message, error: true };
		}
	}

	function getAttribute(node, name, fallback) {
		const value = node.getAttribute(name);
		return value === null || value === "" ? fallback : value;
	}

	function parseNcx(xmlText) {
		if (!xmlText || !xmlText.trim()) throw new Error("请输入或选择包含内容的 NCX 文件");
		const documentNode = new DOMParser().parseFromString(xmlText, "application/xml");
		const parserError = documentNode.querySelector("parsererror");
		if (parserError) throw new Error("XML 格式错误，请确认文件未损坏");

		const nodes = Array.from(documentNode.getElementsByTagName("Connection"));
		if (!nodes.length) throw new Error("未找到 Connection 节点，请确认这是 Navicat 导出的 NCX 文件");

		return nodes.map((node, index) => {
			const passwordEncrypted = getAttribute(node, "Password", "");
			const profiles = Array.from(node.children)
				.filter((child) => child.tagName === "Profile")
				.map((profile) => {
					const encrypted = getAttribute(profile, "Password", "");
					return {
						name: getAttribute(profile, "ProfileName", "未知配置"),
						username: getAttribute(profile, "UserName", "未知用户"),
						password: decryptPassword(encrypted)
					};
				});

			return {
				id: index + 1,
				name: getAttribute(node, "ConnectionName", "未知名称"),
				type: getAttribute(node, "ConnType", "未知类型"),
				host: getAttribute(node, "Host", "未知主机"),
				port: getAttribute(node, "Port", "默认端口"),
				username: getAttribute(node, "UserName", "未知用户"),
				password: decryptPassword(passwordEncrypted),
				profiles
			};
		});
	}

	function el(tag, className, text) {
		const node = document.createElement(tag);
		if (className) node.className = className;
		if (text !== undefined) node.textContent = text;
		return node;
	}

	function passwordControl(result) {
		const control = el("div", "password-control");
		if (result.error) {
			control.append(el("span", "password-error", result.value));
			return control;
		}
		if (result.value === "无密码") {
			control.append(el("span", "password-empty", "无密码"));
			return control;
		}

		const password = el("span", "password-text masked", "••••••••");
		password.dataset.value = result.value;
		const reveal = el("button", "text-action", "显示");
		reveal.type = "button";
		reveal.setAttribute("aria-label", "显示密码");
		reveal.addEventListener("click", () => {
			const masked = password.classList.toggle("masked");
			password.textContent = masked ? "••••••••" : password.dataset.value;
			reveal.textContent = masked ? "显示" : "隐藏";
			reveal.setAttribute("aria-label", masked ? "显示密码" : "隐藏密码");
		});
		const copy = el("button", "text-action", "复制");
		copy.type = "button";
		copy.setAttribute("aria-label", "复制密码");
		copy.addEventListener("click", () => copyText(result.value));
		control.append(password, reveal, copy);
		return control;
	}

	function connectionCard(connection) {
		const card = el("article", "connection-card open");
		const summary = el("button", "connection-summary");
		summary.type = "button";
		summary.setAttribute("aria-expanded", "true");
		const iconText = connection.type === "未知类型" ? "DB" : connection.type.slice(0, 3);
		const icon = el("span", "db-icon", iconText);
		const summaryMain = el("span", "summary-main");
		const titleLine = el("span", "summary-title-line");
		titleLine.append(el("span", "summary-title", connection.name), el("span", "type-tag", connection.type));
		summaryMain.append(titleLine);
		const subtitle = el("span", "summary-subtitle");
		subtitle.append(el("span", "", connection.host + ":" + connection.port), el("span", "meta-divider", "·"), el("span", "", connection.username));
		summaryMain.append(subtitle);
		summary.append(icon, summaryMain);
		if (connection.profiles.length) summary.append(el("span", "profile-count", connection.profiles.length + " 个子配置"));
		const chevron = document.createElementNS("http://www.w3.org/2000/svg", "svg");
		chevron.setAttribute("viewBox", "0 0 24 24");
		chevron.setAttribute("class", "chevron");
		chevron.innerHTML = '<path d="m6 9 6 6 6-6"/>';
		summary.append(chevron);
		summary.addEventListener("click", () => {
			const open = card.classList.toggle("open");
			summary.setAttribute("aria-expanded", String(open));
		});

		const details = el("div", "connection-details");
		const passwordRow = el("div", "password-row");
		passwordRow.append(el("span", "row-label", "连接密码"), passwordControl(connection.password));
		details.append(passwordRow);

		if (connection.profiles.length) {
			const profiles = el("div", "profiles");
			const profilesHead = el("div", "profiles-head");
			profilesHead.append(el("h3", "", "子配置"), el("span", "", connection.profiles.length + " 个"));
			profiles.append(profilesHead);
			connection.profiles.forEach((profile) => {
				const row = el("div", "profile-row");
				const identity = el("div", "profile-identity");
				identity.append(el("strong", "", profile.name), el("span", "", profile.username));
				row.append(identity, passwordControl(profile.password));
				profiles.append(row);
			});
			details.append(profiles);
		}
		card.append(summary, details);
		return card;
	}

	function renderConnections() {
		const query = elements.searchInput.value.trim().toLowerCase();
		const filtered = connections.filter((connection) => [connection.name, connection.type, connection.host, connection.port, connection.username]
			.some((value) => String(value).toLowerCase().includes(query)));
		elements.connectionList.replaceChildren(...filtered.map(connectionCard));
		elements.noMatches.classList.toggle("hidden", filtered.length !== 0);
	}

	function displayResults(parsed, source) {
		connections = parsed;
		elements.resultCount.textContent = String(parsed.length);
		elements.sourceName.textContent = source;
		elements.searchInput.value = "";
		elements.resultsSection.classList.remove("hidden");
		renderConnections();
		const failed = parsed.reduce((count, item) => count + Number(item.password.error) + item.profiles.filter((profile) => profile.password.error).length, 0);
		showMessage("解析完成：找到 " + parsed.length + " 个连接" + (failed ? "，其中 " + failed + " 个密码无法解密" : ""), failed ? "error" : "success");
		elements.resultsSection.scrollIntoView({ behavior: "smooth", block: "start" });
	}

	function processXml(text, source) {
		try {
			displayResults(parseNcx(text), source);
		} catch (error) {
			showMessage(error.message || "解析失败", "error");
		}
	}

	function handleFile(file) {
		hideMessage();
		if (!file) return;
		if (file.size > MAX_FILE_SIZE) return showMessage("文件超过 10 MB，请选择较小的 NCX 文件", "error");
		const reader = new FileReader();
		reader.addEventListener("load", () => processXml(String(reader.result || ""), file.name));
		reader.addEventListener("error", () => showMessage("无法读取文件，请重试", "error"));
		reader.readAsText(file, "UTF-8");
	}

	async function copyText(text) {
		try {
			await navigator.clipboard.writeText(text);
		} catch (_) {
			const input = document.createElement("textarea");
			input.value = text;
			input.style.position = "fixed";
			input.style.opacity = "0";
			document.body.append(input);
			input.select();
			document.execCommand("copy");
			input.remove();
		}
		showToast("已复制到剪贴板");
	}

	function exportJson() {
		const output = connections.map((connection) => ({
			name: connection.name, type: connection.type, host: connection.host, port: connection.port,
			username: connection.username, password: connection.password.value,
			profiles: connection.profiles.map((profile) => ({ name: profile.name, username: profile.username, password: profile.password.value }))
		}));
		const blob = new Blob([JSON.stringify(output, null, 2)], { type: "application/json;charset=utf-8" });
		const url = URL.createObjectURL(blob);
		const anchor = document.createElement("a");
		anchor.href = url;
		anchor.download = "navicat-connections-decrypted.json";
		anchor.click();
		setTimeout(() => URL.revokeObjectURL(url), 1000);
		showToast("JSON 已导出");
	}

	function clearAll() {
		connections = [];
		elements.fileInput.value = "";
		elements.xmlInput.value = "";
		elements.searchInput.value = "";
		elements.connectionList.replaceChildren();
		elements.resultsSection.classList.add("hidden");
		hideMessage();
		showToast("敏感数据已从页面清空");
	}

	elements.fileTab.addEventListener("click", () => setTab("file"));
	elements.pasteTab.addEventListener("click", () => setTab("paste"));
	elements.chooseFileBtn.addEventListener("click", (event) => { event.stopPropagation(); elements.fileInput.click(); });
	elements.dropZone.addEventListener("click", () => elements.fileInput.click());
	elements.dropZone.addEventListener("keydown", (event) => {
		if (event.key === "Enter" || event.key === " ") { event.preventDefault(); elements.fileInput.click(); }
	});
	elements.fileInput.addEventListener("change", () => handleFile(elements.fileInput.files[0]));
	["dragenter", "dragover"].forEach((name) => elements.dropZone.addEventListener(name, (event) => {
		event.preventDefault();
		elements.dropZone.classList.add("dragging");
	}));
	["dragleave", "drop"].forEach((name) => elements.dropZone.addEventListener(name, (event) => {
		event.preventDefault();
		elements.dropZone.classList.remove("dragging");
	}));
	elements.dropZone.addEventListener("drop", (event) => handleFile(event.dataTransfer.files[0]));
	elements.parseTextBtn.addEventListener("click", () => processXml(elements.xmlInput.value, "粘贴的 XML 内容"));
	elements.searchInput.addEventListener("input", renderConnections);
	elements.exportBtn.addEventListener("click", exportJson);
	elements.clearBtn.addEventListener("click", clearAll);
})();
