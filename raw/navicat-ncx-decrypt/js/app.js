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
						passwordEncrypted: encrypted,
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
				passwordEncrypted,
				password: decryptPassword(passwordEncrypted),
				savePassword: getAttribute(node, "SavePassword", "false").toLowerCase() === "true" ? "是" : "否",
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

	function detail(label, value, options) {
		const wrapper = el("div", "detail");
		wrapper.append(el("span", "detail-label", label));
		const valueNode = el("div", "detail-value" + (options && options.error ? " status-error" : ""));
		if (options && options.password) {
			const password = el("span", "password-text masked", value === "无密码" ? value : "••••••••");
			password.dataset.value = value;
			valueNode.append(password);
			if (value !== "无密码") {
				const reveal = el("button", "btn btn-secondary btn-small", "显示");
				reveal.type = "button";
				reveal.addEventListener("click", () => {
					const masked = password.classList.toggle("masked");
					password.textContent = masked ? "••••••••" : password.dataset.value;
					reveal.textContent = masked ? "显示" : "隐藏";
				});
				const copy = el("button", "btn btn-secondary btn-small", "复制");
				copy.type = "button";
				copy.addEventListener("click", () => copyText(value));
				valueNode.append(reveal, copy);
			}
		} else {
			valueNode.append(el("span", "", value));
		}
		wrapper.append(valueNode);
		return wrapper;
	}

	function connectionCard(connection) {
		const card = el("article", "connection-card open");
		const summary = el("button", "connection-summary");
		summary.type = "button";
		summary.setAttribute("aria-expanded", "true");
		const iconText = connection.type === "未知类型" ? "DB" : connection.type.slice(0, 3);
		const icon = el("span", "db-icon", iconText);
		const summaryMain = el("span", "summary-main");
		summaryMain.append(el("span", "summary-title", connection.name));
		summaryMain.append(el("span", "summary-subtitle", connection.host + ":" + connection.port + " · " + connection.username));
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
		const grid = el("div", "detail-grid");
		grid.append(
			detail("类型", connection.type), detail("地址", connection.host + ":" + connection.port),
			detail("用户名", connection.username), detail("保存密码", connection.savePassword),
			detail("明文密码", connection.password.value, { password: true, error: connection.password.error }),
			detail("加密值", connection.passwordEncrypted || "—")
		);
		details.append(grid);

		if (connection.profiles.length) {
			const profiles = el("div", "profiles");
			profiles.append(el("h3", "", "子配置"));
			connection.profiles.forEach((profile) => {
				const row = el("div", "profile-row");
				row.append(el("span", "", profile.name), el("span", "", profile.username));
				const password = el("span", profile.password.error ? "status-error" : "", profile.password.value);
				row.append(password);
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
			username: connection.username, password: connection.password.value, save_password: connection.savePassword,
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
