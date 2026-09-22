// === i18n Configuration ===
const i18n = {
	zh: {
		// Navigation
		appTitle: "GAuth 迁移助手 Pro",
		exportBtn: "导出数据",

		// Upload Section
		uploadTitle: "Google Authenticator 纯本地化迁移",
		uploadDesc:
			'<span style="color: var(--success); font-weight: 600">全程浏览器离线处理</span>、双引擎解析、自动增强去噪、支持批量处理',
		selectImages: "选择图片",
		linkParse: "链接解析",

		// Info Banner
		infoBannerTitle: "🔒 数据安全提示",
		infoBannerText:
			'您的账户数据已安全保存在本地浏览器中（15分钟后自动清除）。<span class="info-banner-highlight">完成迁移后，请及时点击"清空"按钮删除所有敏感数据</span>，确保账户安全。',

		// Stats Bar
		parsed: "已解析",
		accounts: "个账户",
		search: "搜索...",
		clear: "清空",

		// Empty State
		emptyState: "暂无数据",

		// Modals - Export
		exportModalTitle: "选择导出格式",
		exportBitwarden: "Bitwarden (JSON)",
		exportBitwardenDesc: "适用于 Bitwarden, Vaultwarden 导入",
		exportCSV: "通用 CSV",
		exportCSVDesc:
			"适用于 1Password, KeePass, Enpass, LastPass",
		exportTxt: "纯 URI 文本 (.txt)",
		exportTxtDesc:
			"适用于 Aegis, 2FAS 或生成新二维码 (万能格式)",
		exportQR: "二维码打包 (.zip)",
		exportQRDesc: "为每个密钥生成二维码图片并打包下载",

		// Modals - Progress
		progressTitle: "正在处理",
		progressInit: "初始化...",
		progressStatus: "处理 {current}/{total}: {msg}",
		progressRetry: "{name}（重试 {current}/{total}）",
		progressCompress: "正在压缩...",
		progressGenerateQR: "生成二维码 {name}",

		// Modals - Manual
		manualTitle: "手动解析",
		manualPlaceholder: "粘贴 otpauth-migration://...",
		manualConfirm: "确认解析",

		// Modals - QR
		qrTitle: "二维码",
		qrAccount: "账户名称",
		qrIssuer: "发行者",
		qrType: "类型",
		qrAlgo: "算法",
		qrUnknown: "未知",
		digitsUnit: "位",
		qrSecret: "密钥 KEY",
		copy: "复制",

		// Modals - Confirm
		confirmTitle: "确认操作",
		confirmMessage: "此操作无法撤销",
		confirmCancel: "取消",
		confirmOK: "确认",

		// Card
		cardQR: "二维码",
		cardDelete: "删除",
		cardUnnamed: "未命名账户",

		// Toast Messages
		toastRecovered:
			"已恢复 {count} 个账户（数据将在15分钟后自动清除）",
		toastAllSuccess: "🎉 成功解析全部 {count} 张图片！",
		toastPartialSuccess:
			"完成：成功 {success} 张，失败 {fail} 张（查看控制台了解详情）",
		toastAllFailed:
			"解析失败，请检查图片质量或尝试手动输入链接",
		toastExportSuccess: "导出成功",
		toastDeleteSuccess: "删除成功",
		toastCopied: "已复制到剪贴板",
		toastClearSuccess: "已清空所有数据",
		toastParseSuccess: "✅ 成功解析 {count} 个账户",
		toastNoAccounts: "未找到有效账户",
		toastInvalidInput: "请输入链接",
		toastQRExportSuccess: "成功导出 {count} 个二维码",
		toastNoExport: "没有可导出的账户",

		// Error Messages
		errorInvalidLink:
			"请输入有效的 Google Authenticator 迁移链接",
		errorMissingData: "链接格式错误：缺少数据部分",
		errorBase64: "数据格式错误：无法解码",
		errorProtobuf: "数据损坏：",
		errorDecodeFailed: "所有解码策略均失败",
		errorNoParsedAccounts: "未解析到任何账户",
		errorEmptyData: "解码后数据为空",
		errorQRGeneration: "二维码生成失败",
		errorExportFailed: "导出失败",

		// Confirm Dialog
		confirmDelete: "确定删除？",
		confirmDeleteMsg: "此操作将从列表删除该账户",
		confirmClearAll: "确定清空所有账户？",
		confirmClearAllMsg:
			"此操作将永久删除所有敏感数据，无法恢复",
	},
	en: {
		// Navigation
		appTitle: "GAuth Migrator Pro",
		exportBtn: "Export Data",

		// Upload Section
		uploadTitle: "Google Authenticator Local Migration",
		uploadDesc:
			'<span style="color: var(--success); font-weight: 600">100% Offline Browser Processing</span>, Dual-Engine Parsing, Auto-Enhancement, Batch Support',
		selectImages: "Select Images",
		linkParse: "Parse Link",

		// Info Banner
		infoBannerTitle: "🔒 Data Security Notice",
		infoBannerText:
			'Your account data is securely stored in your local browser (auto-deleted after 15 minutes). <span class="info-banner-highlight">After migration, please click the "Clear" button to delete all sensitive data</span> to ensure account security.',

		// Stats Bar
		parsed: "Parsed",
		accounts: "accounts",
		search: "Search...",
		clear: "Clear",

		// Empty State
		emptyState: "No data",

		// Modals - Export
		exportModalTitle: "Select Export Format",
		exportBitwarden: "Bitwarden (JSON)",
		exportBitwardenDesc: "For Bitwarden, Vaultwarden import",
		exportCSV: "Universal CSV",
		exportCSVDesc: "For 1Password, KeePass, Enpass, LastPass",
		exportTxt: "Plain URI Text (.txt)",
		exportTxtDesc:
			"For Aegis, 2FAS or generate new QR codes (universal format)",
		exportQR: "QR Code Package (.zip)",
		exportQRDesc:
			"Generate QR code images for each key and package for download",

		// Modals - Progress
		progressTitle: "Processing",
		progressInit: "Initializing...",
		progressStatus: "Processing {current}/{total}: {msg}",
		progressRetry: "{name} (retry {current}/{total})",
		progressCompress: "Compressing...",
		progressGenerateQR: "Generating QR for {name}",

		// Modals - Manual
		manualTitle: "Manual Parse",
		manualPlaceholder: "Paste otpauth-migration://...",
		manualConfirm: "Confirm Parse",

		// Modals - QR
		qrTitle: "QR Code",
		qrAccount: "Account Name",
		qrIssuer: "Issuer",
		qrType: "Type",
		qrAlgo: "Algorithm",
		qrUnknown: "Unknown",
		digitsUnit: "digits",
		qrSecret: "Secret KEY",
		copy: "Copy",

		// Modals - Confirm
		confirmTitle: "Confirm Action",
		confirmMessage: "This action cannot be undone",
		confirmCancel: "Cancel",
		confirmOK: "Confirm",

		// Card
		cardQR: "QR Code",
		cardDelete: "Delete",
		cardUnnamed: "Unnamed Account",

		// Toast Messages
		toastRecovered:
			"Recovered {count} accounts (data will auto-delete after 15 minutes)",
		toastAllSuccess:
			"🎉 Successfully parsed all {count} images!",
		toastPartialSuccess:
			"Completed: {success} succeeded, {fail} failed (check console for details)",
		toastAllFailed:
			"Parsing failed, please check image quality or try manual input",
		toastExportSuccess: "Export successful",
		toastDeleteSuccess: "Deleted successfully",
		toastCopied: "Copied to clipboard",
		toastClearSuccess: "All data cleared",
		toastParseSuccess:
			"✅ Successfully parsed {count} accounts",
		toastNoAccounts: "No valid accounts found",
		toastInvalidInput: "Please enter a link",
		toastQRExportSuccess:
			"Successfully exported {count} QR codes",
		toastNoExport: "No accounts to export",

		// Error Messages
		errorInvalidLink:
			"Please enter a valid Google Authenticator migration link",
		errorMissingData: "Link format error: missing data field",
		errorBase64: "Data format error: cannot decode",
		errorProtobuf: "Data corrupted: ",
		errorDecodeFailed: "All decoding strategies failed",
		errorNoParsedAccounts: "No accounts parsed",
		errorEmptyData: "Decoded data is empty",
		errorQRGeneration: "QR code generation failed",
		errorExportFailed: "Export failed",

		// Confirm Dialog
		confirmDelete: "Confirm Delete?",
		confirmDeleteMsg:
			"This will remove the account from the list",
		confirmClearAll: "Clear All Accounts?",
		confirmClearAllMsg:
			"This will permanently delete all sensitive data and cannot be undone",
	},
};

let currentLang = "zh";

function t(key, params = {}) {
	let text = i18n[currentLang][key] || i18n.zh[key] || key;
	Object.keys(params).forEach((param) => {
		text = text.replace(`{${param}}`, params[param]);
	});
	return text;
}

function setLanguage(lang) {
	currentLang = lang;
	localStorage.setItem("preferred_language", lang);
	updateUILanguage();
}

function detectLanguage() {
	const saved = localStorage.getItem("preferred_language");
	if (saved) return saved;
	const browserLang =
		navigator.language || navigator.userLanguage;
	return browserLang.startsWith("zh") ? "zh" : "en";
}

function updateUILanguage() {
	// Update navigation
	document.getElementById("navTitle").textContent = t("appTitle");
	document.getElementById("exportBtnText").textContent =
		t("exportBtn");

	// Update upload section
	const uploadSection =
		document.querySelector(".upload-content h2");
	if (uploadSection) {
		uploadSection.textContent = t("uploadTitle");
	}
	const uploadDesc = document.querySelector(".upload-content p");
	if (uploadDesc) {
		uploadDesc.innerHTML = t("uploadDesc");
	}
	const selectImagesBtn = document.querySelector(
		".upload-content .btn-primary"
	);
	if (selectImagesBtn) {
		selectImagesBtn.textContent = t("selectImages");
	}
	const linkParseBtn = document.querySelector(
		".upload-content .btn-secondary"
	);
	if (linkParseBtn) {
		linkParseBtn.textContent = t("linkParse");
	}

	// Update info banner
	const infoBannerTitle =
		document.querySelector(".info-banner-title");
	if (infoBannerTitle) {
		infoBannerTitle.textContent = t("infoBannerTitle");
	}
	const infoBannerText =
		document.querySelector(".info-banner-text");
	if (infoBannerText) {
		infoBannerText.innerHTML = t("infoBannerText");
	}

	// Update stats bar
	const statsBarText = document.querySelector(
		"#statsBar > div:first-child"
	);
	if (statsBarText) {
		const count =
			document.getElementById("countDisplay").textContent;
		statsBarText.innerHTML = `${t(
			"parsed"
		)} <span id="countDisplay" style="color: var(--primary)">${count}</span> ${t(
			"accounts"
		)}`;
	}
	const searchInput = document.getElementById("searchInput");
	if (searchInput) {
		searchInput.placeholder = t("search");
	}
	const clearBtn = document.querySelector(
		"#statsBar .btn-danger"
	);
	if (clearBtn) {
		clearBtn.textContent = t("clear");
	}

	// Update empty state
	const emptyState = document.getElementById("emptyState");
	if (emptyState) {
		emptyState.textContent = t("emptyState");
	}

	// Update export modal
	document.querySelector("#exportModal h3").textContent =
		t("exportModalTitle");
	const exportOptions = document.querySelectorAll(
		"#exportModal .export-option"
	);
	if (exportOptions[0]) {
		exportOptions[0].querySelector("h4").textContent =
			t("exportBitwarden");
		exportOptions[0].querySelector("p").textContent = t(
			"exportBitwardenDesc"
		);
	}
	if (exportOptions[1]) {
		exportOptions[1].querySelector("h4").textContent =
			t("exportCSV");
		exportOptions[1].querySelector("p").textContent =
			t("exportCSVDesc");
	}
	if (exportOptions[2]) {
		exportOptions[2].querySelector("h4").textContent =
			t("exportTxt");
		exportOptions[2].querySelector("p").textContent =
			t("exportTxtDesc");
	}
	if (exportOptions[3]) {
		exportOptions[3].querySelector("h4").textContent =
			t("exportQR");
		exportOptions[3].querySelector("p").textContent =
			t("exportQRDesc");
	}

	// Update progress modal
	document.querySelector("#progressModal h3").textContent =
		t("progressTitle");
	const progressText = document.getElementById("progressText");
	if (
		progressText &&
		[i18n.zh.progressInit, i18n.en.progressInit].includes(
			progressText.textContent
		)
	) {
		progressText.textContent = t("progressInit");
	}

	// Update manual modal
	document.querySelector("#manualModal h3").textContent =
		t("manualTitle");
	const manualInput = document.getElementById("manualInput");
	if (manualInput) {
		manualInput.placeholder = t("manualPlaceholder");
	}
	const manualConfirmBtn = document.querySelector(
		"#manualModal .btn-primary"
	);
	if (manualConfirmBtn) {
		manualConfirmBtn.textContent = t("manualConfirm");
	}

	// Update confirm modal
	const confirmTitle = document.getElementById("confirmTitle");
	const confirmMessage =
		document.getElementById("confirmMessage");
	if (
		confirmTitle &&
		[i18n.zh.confirmTitle, i18n.en.confirmTitle].includes(
			confirmTitle.textContent
		)
	) {
		confirmTitle.textContent = t("confirmTitle");
	}
	if (
		confirmMessage &&
		[i18n.zh.confirmMessage, i18n.en.confirmMessage].includes(
			confirmMessage.textContent
		)
	) {
		confirmMessage.textContent = t("confirmMessage");
	}
	const confirmBtns = document.querySelectorAll(
		"#confirmModal button"
	);
	if (confirmBtns[0]) {
		confirmBtns[0].textContent = t("confirmCancel");
	}
	if (confirmBtns[1]) {
		confirmBtns[1].textContent = t("confirmOK");
	}

	// Update language button active state
	document.querySelectorAll(".lang-btn").forEach((btn) => {
		btn.classList.toggle(
			"active",
			btn.dataset.lang === currentLang
		);
	});

	// Re-render account cards with translated text
	renderGrid();
}

// === State ===
let state = { accounts: [] };
const DB_NAME = "GAuthMigratorDB";
const DB_VERSION = 1;
const STORE_NAME = "accounts";
const EXPIRY_MINUTES = 15;
let db = null;

// === IndexedDB Setup ===
async function initDB() {
	return new Promise((resolve, reject) => {
		const request = indexedDB.open(DB_NAME, DB_VERSION);

		request.onerror = () => reject(request.error);
		request.onsuccess = () => {
			db = request.result;
			resolve(db);
		};

		request.onupgradeneeded = (event) => {
			const db = event.target.result;
			if (!db.objectStoreNames.contains(STORE_NAME)) {
				db.createObjectStore(STORE_NAME);
			}
		};
	});
}

async function saveToIndexedDB(data) {
	if (!db) return;
	try {
		const tx = db.transaction(STORE_NAME, "readwrite");
		const store = tx.objectStore(STORE_NAME);
		const record = {
			accounts: data,
			timestamp: Date.now(),
		};
		store.put(record, "data");
		await new Promise((resolve, reject) => {
			tx.oncomplete = resolve;
			tx.onerror = reject;
		});
	} catch (error) {
		console.error("保存到 IndexedDB 失败:", error);
	}
}

async function loadFromIndexedDB() {
	if (!db) return null;
	try {
		const tx = db.transaction(STORE_NAME, "readonly");
		const store = tx.objectStore(STORE_NAME);
		const request = store.get("data");

		return new Promise((resolve) => {
			request.onsuccess = () => {
				const data = request.result;
				if (!data) {
					resolve(null);
					return;
				}

				// 检查是否过期（15分钟）
				const elapsed = Date.now() - data.timestamp;
				const expiryMs = EXPIRY_MINUTES * 60 * 1000;

				if (elapsed > expiryMs) {
					console.log("数据已过期，自动清除");
					clearIndexedDB();
					resolve(null);
				} else {
					resolve(data.accounts);
				}
			};
			request.onerror = () => resolve(null);
		});
	} catch (error) {
		console.error("从 IndexedDB 加载失败:", error);
		return null;
	}
}

async function clearIndexedDB() {
	if (!db) return;
	try {
		const tx = db.transaction(STORE_NAME, "readwrite");
		const store = tx.objectStore(STORE_NAME);
		store.delete("data");
		await new Promise((resolve, reject) => {
			tx.oncomplete = resolve;
			tx.onerror = reject;
		});
	} catch (error) {
		console.error("清除 IndexedDB 失败:", error);
	}
}

// === Icons ===
const ICONS = {
	github: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>',
	google: '<svg viewBox="0 0 24 24"><path fill="#EA4335" d="M12 5.04c1.86 0 3.52.66 4.82 1.88l3.6-3.6C18.24 1.24 15.34 0 12 0 7.4 0 3.38 2.64 1.43 6.53l4.2 3.26C6.6 6.86 9.07 5.04 12 5.04z"/><path fill="#34A853" d="M24 12.3c0-.85-.08-1.67-.22-2.46H12v4.66h6.76c-.3 1.54-1.16 2.84-2.47 3.72l3.98 3.09c2.32-2.14 3.67-5.29 3.67-9.01z"/><path fill="#4A90E2" d="M4.33 14.54c-.26-.77-.41-1.6-.41-2.46s.15-1.69.41-2.46L.13 6.36A11.96 11.96 0 0 0 0 12c0 1.98.48 3.86 1.33 5.54l4.33-3.26z"/><path fill="#FBBC05" d="M12 24c3.24 0 5.86-1.07 7.84-2.9l-3.98-3.09c-1.07.72-2.44 1.14-3.86 1.14-2.93 0-5.41-1.98-6.3-4.64l-4.2 3.26C3.38 21.36 7.4 24 12 24z"/></svg>',
	aws: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12.9 8.4c-1.9 0-3.3.4-3.3 2.7v.1c0 1.9 1.4 2.5 3.1 2.5 1.4 0 2.5-.5 2.5-1.9v-2c-.7-.9-1.5-1.4-2.3-1.4zm6.6-4.9c-.8-.4-1.7-.5-2.6-.5-3.3 0-5.3 1.7-6.1 4.2-1-.7-2.3-1.1-3.6-1.1-3.6 0-6 2.5-6 6.2 0 2.8 1.6 5 4.3 5 1.7 0 3-.6 3.9-1.8.3 1.1 1.3 1.7 2.6 1.7.9 0 1.8-.3 2.5-.7v-3.7c-.8.5-1.5.7-2.1.7-.6 0-1-.3-1-1v-4.9c0-2 .9-2.8 2.5-2.8.5 0 1 .1 1.4.3v-1.6z"/></svg>',
	default:
		'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>',
};

// === DOM Events ===
const dropZone = document.getElementById("dropZone");
const fileInput = document.getElementById("fileInput");

dropZone.addEventListener("dragover", (e) => {
	e.preventDefault();
	dropZone.style.borderColor = "var(--primary)";
	dropZone.style.background = "#f5f3ff";
});
dropZone.addEventListener("dragleave", () => {
	dropZone.style.borderColor = "var(--border)";
	dropZone.style.background = "var(--bg-surface)";
});
dropZone.addEventListener("drop", (e) => {
	e.preventDefault();
	dropZone.style.borderColor = "var(--border)";
	dropZone.style.background = "var(--bg-surface)";
	if (e.dataTransfer.files.length)
		handleBatchFiles(e.dataTransfer.files);
});
fileInput.addEventListener("change", (e) => {
	if (e.target.files.length) handleBatchFiles(e.target.files);
	fileInput.value = "";
});
document
	.getElementById("searchInput")
	.addEventListener("input", (e) => renderGrid(e.target.value));

// === Core: Batch Processing ===
async function handleBatchFiles(fileList) {
	openModal("progressModal");
	const files = Array.from(fileList);
	const total = files.length;
	let success = 0;
	const failedFiles = [];
	const MAX_RETRIES = 2;

	for (let i = 0; i < total; i++) {
		const file = files[i];
		let lastError = null;
		let retryCount = 0;
		let succeeded = false;

		// 重试机制
		while (retryCount <= MAX_RETRIES && !succeeded) {
			try {
				const progressMsg =
					retryCount > 0
						? t("progressRetry", {
								name: file.name,
								current: retryCount,
								total: MAX_RETRIES,
						  })
						: file.name;
				updateProgress(i + 1, total, progressMsg);

				const rawText = await decodeViolently(file);
				const newAcc = parseProtobuf(rawText);

				if (newAcc && newAcc.length > 0) {
					mergeAccounts(newAcc);
					success++;
					succeeded = true;
					console.log(
						`✓ ${file.name}: 成功解析 ${newAcc.length} 个账户`
					);
				} else {
					throw new Error(t("errorNoParsedAccounts"));
				}
			} catch (e) {
				lastError = e;
				retryCount++;

				if (retryCount <= MAX_RETRIES) {
					console.log(
						`✗ ${file.name}: ${e.message} - ${t(
							"progressRetry",
							{
								name: file.name,
								current: retryCount,
								total: MAX_RETRIES,
							}
						)}`
					);
					await new Promise((r) => setTimeout(r, 300));
				}
			}
		}

		// 记录失败的文件
		if (!succeeded) {
			const failType =
				lastError?.message.includes("解码") ||
				lastError?.message
					.toLowerCase?.()
					.includes("decode")
					? currentLang === "zh"
						? "二维码识别"
						: "QR decoding"
					: lastError?.message.includes("Protobuf")
					? currentLang === "zh"
						? "数据解析"
						: "Data parse"
					: currentLang === "zh"
					? "其他"
					: "Other";
			failedFiles.push({
				name: file.name,
				error:
					lastError?.message ||
					(currentLang === "zh"
						? "未知错误"
						: "Unknown error"),
				type: failType,
			});
			console.error(`✗ ${file.name}: ${lastError?.message}`);
		}

		await new Promise((r) => setTimeout(r, 50));
	}

	setTimeout(() => {
		closeModal("progressModal");
		renderGrid();

		const fail = failedFiles.length;
		if (success > 0) {
			if (fail === 0) {
				showToast(
					t("toastAllSuccess", { count: success }),
					"success"
				);
			} else {
				showToast(
					t("toastPartialSuccess", { success, fail }),
					"error"
				);
				console.group(
					currentLang === "zh"
						? "❌ 失败文件详情"
						: "❌ Failed files detail"
				);
				failedFiles.forEach((f) => {
					console.error(
						`📄 ${f.name}\n   类型: ${f.type}\n   原因: ${f.error}`
					);
				});
				console.groupEnd();
			}
		} else {
			showToast(t("toastAllFailed"), "error");
			console.group(
				currentLang === "zh"
					? "❌ 所有文件均失败"
					: "❌ All files failed"
			);
			failedFiles.forEach((f) => {
				console.error(`📄 ${f.name}: ${f.error}`);
			});
			console.groupEnd();
		}
	}, 500);
}

// === Core: Decoding (Hybrid Engine) ===
async function decodeViolently(file) {
	let img = await loadImage(file);

	// 性能优化：大图片自动缩放
	const MAX_SIZE = 1500;
	if (img.width > MAX_SIZE || img.height > MAX_SIZE) {
		img = await resizeImage(img, MAX_SIZE);
	}

	// 策略1: 浏览器原生API（最快最准）
	if ("BarcodeDetector" in window) {
		try {
			const det = new BarcodeDetector({
				formats: ["qr_code"],
			});
			const bars = await det.detect(img);
			if (bars.length) return bars[0].rawValue;
		} catch (e) {
			console.log("BarcodeDetector 失败:", e.message);
		}
	}

	// 创建复用的 canvas
	const canvas = document.createElement("canvas");
	canvas.width = img.width;
	canvas.height = img.height;
	const ctx = canvas.getContext("2d", {
		willReadFrequently: true,
	});

	// 优化的策略列表（按成功率排序）
	const strategies = [
		{ name: "Raw", fn: null, engines: ["jsQR", "zxing"] },
		{ name: "Sharpen", fn: filterSharpen, engines: ["jsQR"] },
		{
			name: "AdaptiveBin",
			fn: filterAdaptiveBinarize,
			engines: ["jsQR"],
		},
		{
			name: "Bin-128",
			fn: (c, w, h) => filterBinarize(c, w, h, 128),
			engines: ["jsQR"],
		},
		{ name: "Denoise", fn: filterDenoise, engines: ["jsQR"] },
		{
			name: "HighContrast",
			fn: filterHighContrast,
			engines: ["jsQR", "zxing"],
		},
		{ name: "Invert", fn: filterInvert, engines: ["jsQR"] },
		{ name: "Scale-2x", scale: 2, fn: null, engines: ["jsQR"] },
	];

	const zxing = new ZXing.BrowserMultiFormatReader();

	for (const strat of strategies) {
		try {
			// 调整 canvas 大小
			const scale = strat.scale || 1;
			if (scale !== 1) {
				canvas.width = img.width * scale;
				canvas.height = img.height * scale;
			} else {
				canvas.width = img.width;
				canvas.height = img.height;
			}

			// 绘制图像
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

			// 应用滤镜
			if (strat.fn) {
				strat.fn(ctx, canvas.width, canvas.height);
			}

			// 尝试不同的解码引擎
			for (const engine of strat.engines) {
				if (engine === "jsQR" && window.jsQR) {
					const imgData = ctx.getImageData(
						0,
						0,
						canvas.width,
						canvas.height
					);
					const code = jsQR(
						imgData.data,
						canvas.width,
						canvas.height,
						{
							inversionAttempts: "dontInvert",
						}
					);
					if (code) {
						console.log(
							`成功策略: ${strat.name} (jsQR)`
						);
						return code.data;
					}
				} else if (engine === "zxing") {
					const dataUrl = canvas.toDataURL("image/png");
					const res = await zxing.decodeFromImage(
						undefined,
						dataUrl
					);
					if (res) {
						console.log(
							`成功策略: ${strat.name} (ZXing)`
						);
						return res.text;
					}
				}
			}
		} catch (e) {
			// 继续尝试下一个策略
		}
	}

	throw new Error(t("errorDecodeFailed"));
}

function resizeImage(img, maxSize) {
	return new Promise((resolve) => {
		const canvas = document.createElement("canvas");
		let width = img.width;
		let height = img.height;

		if (width > height) {
			if (width > maxSize) {
				height = (height * maxSize) / width;
				width = maxSize;
			}
		} else {
			if (height > maxSize) {
				width = (width * maxSize) / height;
				height = maxSize;
			}
		}

		canvas.width = width;
		canvas.height = height;
		const ctx = canvas.getContext("2d");
		ctx.drawImage(img, 0, 0, width, height);

		const resized = new Image();
		resized.onload = () => resolve(resized);
		resized.src = canvas.toDataURL();
	});
}

function loadImage(file) {
	return new Promise((r, j) => {
		const u = URL.createObjectURL(file);
		const i = new Image();
		i.onload = () => {
			URL.revokeObjectURL(u);
			r(i);
		};
		i.onerror = j;
		i.src = u;
	});
}
// === Image Filters ===
function filterBinarize(ctx, w, h, threshold) {
	const d = ctx.getImageData(0, 0, w, h);
	for (let i = 0; i < d.data.length; i += 4) {
		const gray =
			0.299 * d.data[i] +
			0.587 * d.data[i + 1] +
			0.114 * d.data[i + 2];
		const v = gray >= threshold ? 255 : 0;
		d.data[i] = d.data[i + 1] = d.data[i + 2] = v;
	}
	ctx.putImageData(d, 0, 0);
}

function filterAdaptiveBinarize(ctx, w, h) {
	const d = ctx.getImageData(0, 0, w, h);
	const gray = new Uint8Array(w * h);

	// 转灰度
	for (let i = 0; i < d.data.length; i += 4) {
		gray[i / 4] =
			0.299 * d.data[i] +
			0.587 * d.data[i + 1] +
			0.114 * d.data[i + 2];
	}

	// Otsu 自动阈值
	let histogram = new Array(256).fill(0);
	for (let i = 0; i < gray.length; i++) {
		histogram[Math.floor(gray[i])]++;
	}

	let total = gray.length;
	let sum = 0;
	for (let i = 0; i < 256; i++) sum += i * histogram[i];

	let sumB = 0,
		wB = 0,
		wF = 0,
		maxVar = 0,
		threshold = 0;
	for (let t = 0; t < 256; t++) {
		wB += histogram[t];
		if (wB === 0) continue;
		wF = total - wB;
		if (wF === 0) break;

		sumB += t * histogram[t];
		let mB = sumB / wB;
		let mF = (sum - sumB) / wF;
		let varBetween = wB * wF * (mB - mF) * (mB - mF);

		if (varBetween > maxVar) {
			maxVar = varBetween;
			threshold = t;
		}
	}

	// 应用阈值
	for (let i = 0; i < d.data.length; i += 4) {
		const v = gray[i / 4] >= threshold ? 255 : 0;
		d.data[i] = d.data[i + 1] = d.data[i + 2] = v;
	}
	ctx.putImageData(d, 0, 0);
}

function filterSharpen(ctx, w, h) {
	const d = ctx.getImageData(0, 0, w, h);
	const original = new Uint8ClampedArray(d.data);
	const kernel = [0, -1, 0, -1, 5, -1, 0, -1, 0];

	for (let y = 1; y < h - 1; y++) {
		for (let x = 1; x < w - 1; x++) {
			for (let c = 0; c < 3; c++) {
				let sum = 0;
				for (let ky = -1; ky <= 1; ky++) {
					for (let kx = -1; kx <= 1; kx++) {
						const idx =
							((y + ky) * w + (x + kx)) * 4 + c;
						sum +=
							original[idx] *
							kernel[(ky + 1) * 3 + (kx + 1)];
					}
				}
				d.data[(y * w + x) * 4 + c] = Math.max(
					0,
					Math.min(255, sum)
				);
			}
		}
	}
	ctx.putImageData(d, 0, 0);
}

function filterDenoise(ctx, w, h) {
	const d = ctx.getImageData(0, 0, w, h);
	const original = new Uint8ClampedArray(d.data);

	// 简单中值滤波
	for (let y = 1; y < h - 1; y++) {
		for (let x = 1; x < w - 1; x++) {
			for (let c = 0; c < 3; c++) {
				const values = [];
				for (let ky = -1; ky <= 1; ky++) {
					for (let kx = -1; kx <= 1; kx++) {
						values.push(
							original[
								((y + ky) * w + (x + kx)) * 4 + c
							]
						);
					}
				}
				values.sort((a, b) => a - b);
				d.data[(y * w + x) * 4 + c] = values[4]; // 中值
			}
		}
	}
	ctx.putImageData(d, 0, 0);
}

function filterHighContrast(ctx, w, h) {
	const d = ctx.getImageData(0, 0, w, h);
	const factor = 1.5;
	const intercept = 128 * (1 - factor);

	for (let i = 0; i < d.data.length; i += 4) {
		d.data[i] = Math.max(
			0,
			Math.min(255, d.data[i] * factor + intercept)
		);
		d.data[i + 1] = Math.max(
			0,
			Math.min(255, d.data[i + 1] * factor + intercept)
		);
		d.data[i + 2] = Math.max(
			0,
			Math.min(255, d.data[i + 2] * factor + intercept)
		);
	}
	ctx.putImageData(d, 0, 0);
}

function filterInvert(ctx, w, h) {
	const d = ctx.getImageData(0, 0, w, h);
	for (let i = 0; i < d.data.length; i += 4) {
		d.data[i] = 255 - d.data[i];
		d.data[i + 1] = 255 - d.data[i + 1];
		d.data[i + 2] = 255 - d.data[i + 2];
	}
	ctx.putImageData(d, 0, 0);
}

// === Core: Protobuf ===
function parseProtobuf(urlStr) {
	if (!urlStr || typeof urlStr !== "string") {
		throw new Error(t("errorInvalidLink"));
	}

	if (!urlStr.includes("otpauth-migration")) {
		throw new Error(t("errorInvalidLink"));
	}

	let b64 = "";
	try {
		const url = new URL(urlStr);
		b64 = url.searchParams.get("data");
	} catch {
		// 容错：手动解析 URL
		const match = urlStr.match(/[?&]data=([^&]+)/);
		b64 = match ? match[1] : null;
	}

	if (!b64) {
		throw new Error(t("errorMissingData"));
	}

	// 解码 URL 编码并转换 Base64URL 到标准 Base64
	b64 = decodeURIComponent(b64)
		.replace(/-/g, "+")
		.replace(/_/g, "/");

	// Base64 解码（先尝试不加padding，失败再加）
	let bytes;
	try {
		const bin = atob(b64);
		bytes = new Uint8Array(bin.length);
		for (let i = 0; i < bin.length; i++) {
			bytes[i] = bin.charCodeAt(i);
		}
	} catch (e) {
		// 尝试添加 padding
		try {
			let paddedB64 = b64;
			while (paddedB64.length % 4 !== 0) {
				paddedB64 += "=";
			}
			const bin = atob(paddedB64);
			bytes = new Uint8Array(bin.length);
			for (let i = 0; i < bin.length; i++) {
				bytes[i] = bin.charCodeAt(i);
			}
		} catch (e2) {
			throw new Error(t("errorBase64"));
		}
	}

	if (bytes.length === 0) {
		throw new Error(t("errorEmptyData"));
	}

	const list = [];
	let ptr = 0;

	const readVarint = () => {
		let r = 0,
			s = 0,
			b;
		do {
			b = bytes[ptr++];
			r |= (b & 0x7f) << s;
			s += 7;
		} while (b & 0x80);
		return r;
	};

	while (ptr < bytes.length) {
		try {
			const k = readVarint();
			const f = k >> 3;
			const t = k & 7;

			if (f === 1 && t === 2) {
				// OTP 参数消息
				const len = readVarint();
				const end = ptr + len;

				if (end > bytes.length) {
					console.warn("消息长度超出范围，跳过此账户");
					ptr = bytes.length; // 防止死循环
					break;
				}

				const item = {
					algo: "SHA1",
					digits: 6,
					type: "totp",
					period: 30,
				};

				while (ptr < end) {
					const pk = readVarint();
					const pf = pk >> 3;
					const pt = pk & 7;

					if (pt === 2) {
						// 字符串/字节字段
						const pl = readVarint();
						if (ptr + pl > bytes.length) {
							console.warn("字段长度超出范围，跳过");
							ptr = bytes.length; // 防止越界
							break;
						}
						const val = bytes.slice(ptr, ptr + pl);
						ptr += pl;

						if (pf === 1) {
							// Secret字段 - 二进制数据直接Base32编码
							try {
								const alphabet =
									"ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
								let bs = 0,
									v = 0,
									out = "";
								for (const b of val) {
									v = (v << 8) | b;
									bs += 8;
									while (bs >= 5) {
										out +=
											alphabet[
												(v >>> (bs - 5)) &
													31
											];
										bs -= 5;
									}
								}
								if (bs > 0) {
									out +=
										alphabet[
											(v << (5 - bs)) & 31
										];
								}
								item.secret = out;
							} catch (e) {
								console.warn("Secret编码失败:", e);
							}
						} else {
							// 其他字段 - UTF-8文本
							try {
								const txt = new TextDecoder(
									"utf-8"
								).decode(val);
								if (pf === 2) {
									item.name = txt;
								} else if (pf === 3) {
									item.issuer = txt;
								} else if (pf === 4) {
									item.algo = txt;
								}
							} catch (e) {
								console.warn(
									"文本字段解码失败:",
									e
								);
							}
						}
					} else if (pt === 0) {
						// Varint 字段
						const val = readVarint();

						if (pf === 4) {
							// Algorithm
							item.algo =
								{
									1: "SHA1",
									2: "SHA256",
									3: "SHA512",
									4: "MD5",
								}[val] || "SHA1";
						} else if (pf === 5) {
							// Digits
							item.digits = val === 2 ? 8 : 6;
						} else if (pf === 6) {
							// Type
							item.type = val === 1 ? "hotp" : "totp";
						} else if (pf === 7) {
							// Counter (for HOTP)
							item.counter = val;
						}
					} else {
						// 跳过未知字段
						if (pt === 2) {
							const skipLen = readVarint();
							ptr += skipLen;
						} else if (pt === 0) {
							readVarint();
						} else if (pt === 5) {
							ptr += 4;
						} else if (pt === 1) {
							ptr += 8;
						}
					}
				}

				// 验证必需字段
				if (item.secret && item.secret.length > 0) {
					// 设置默认值
					if (!item.name || item.name.trim() === "") {
						item.name = item.issuer || t("cardUnnamed");
					}
					list.push(item);
				} else {
					console.warn("跳过无效账户（缺少 secret）");
				}
			} else {
				// 跳过顶级未知字段
				if (t === 2) {
					const skipLen = readVarint();
					ptr += skipLen;
				} else if (t === 0) {
					readVarint();
				} else if (t === 5) {
					ptr += 4;
				} else if (t === 1) {
					ptr += 8;
				}
			}
		} catch (e) {
			// 单个账户解析失败，记录并继续下一个
			console.warn("跳过一个解析失败的账户:", e.message);
			// 尝试恢复到安全位置，跳过剩余数据
			try {
				if (ptr < bytes.length) {
					// 尝试跳过当前损坏的消息
					const skipLen = readVarint();
					if (ptr + skipLen <= bytes.length) {
						ptr += skipLen;
					}
				}
			} catch {
				// 无法恢复，退出循环
				break;
			}
		}
	}

	if (list.length === 0) {
		throw new Error(t("errorNoParsedAccounts"));
	}

	return list;
}

// === UI Logic ===
function mergeAccounts(newItems) {
	const existing = new Set(state.accounts.map((a) => a.secret));
	newItems.forEach((item) => {
		if (!existing.has(item.secret)) state.accounts.push(item);
	});
	// 保存到 IndexedDB
	saveToIndexedDB(state.accounts);
}

function renderGrid(filter = "") {
	const div = document.getElementById("gridContainer");
	div.innerHTML = "";
	const f = filter.toLowerCase();
	const list = state.accounts
		.map((acc, i) => ({ acc, i }))
		.filter(
			(o) =>
				(o.acc.name || "").toLowerCase().includes(f) ||
				(o.acc.issuer || "").toLowerCase().includes(f)
		);

	const hasAccounts = state.accounts.length > 0;
	document
		.getElementById("statsBar")
		.classList.toggle("hidden", !hasAccounts);
	document
		.getElementById("infoBanner")
		.classList.toggle("hidden", !hasAccounts);
	document.getElementById("emptyState").style.display =
		hasAccounts ? "none" : "block";
	document.getElementById("countDisplay").textContent =
		state.accounts.length;
	document.getElementById("exportMenuBtn").disabled =
		!hasAccounts;

	list.forEach(({ acc, i }) => {
		const card = document.createElement("div");
		card.className = "card";
		card.innerHTML = `
                <div class="card-header">
                    <div class="service-icon">${getIcon(acc)}</div>
                    <div class="card-info">
                        <div class="card-title" title="${esc(acc.name)}">${esc(
			acc.name
		)}</div>
                        <div class="card-subtitle">${esc(
				acc.issuer || t("qrUnknown")
			)}</div>
                        <div class="tags"><span class="tag totp">${acc.type.toUpperCase()}</span><span class="tag">${
			acc.algo
		}</span><span class="tag">${acc.digits} ${t(
			"digitsUnit"
		)}</span></div>
                    </div>
                </div>
                <div class="card-actions">
                    <button class="btn btn-secondary btn-sm btn-icon" onclick="showQRCode(${i})" style="flex: 1;">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="3" y="3" width="7" height="7"/>
                            <rect x="14" y="3" width="7" height="7"/>
                            <rect x="3" y="14" width="7" height="7"/>
                            <rect x="14" y="14" width="7" height="7"/>
                        </svg>
                        ${t("cardQR")}
                    </button>
                    <button class="btn delete-btn btn-sm" onclick="removeAccount(${i})">${t(
			"cardDelete"
		)}</button>
                </div>
            `;
		div.appendChild(card);
	});
}

// === Exports ===
function generateUri(acc) {
	const name = acc.issuer
		? `${acc.issuer}:${acc.name}`
		: acc.name;

	let uri = `otpauth://${acc.type}/${encodeURIComponent(
		name
	)}?secret=${acc.secret}`;

	if (acc.issuer) {
		uri += `&issuer=${encodeURIComponent(acc.issuer)}`;
	}

	uri += `&digits=${acc.digits}&algorithm=${acc.algo}`;

	// TOTP 使用 period，HOTP 使用 counter
	if (acc.type === "totp") {
		uri += `&period=${acc.period || 30}`;
	} else if (acc.type === "hotp" && acc.counter !== undefined) {
		uri += `&counter=${acc.counter}`;
	}

	return uri;
}

window.exportData = (type) => {
	let content, mime, name;
	const date = new Date().toISOString().slice(0, 10);

	if (type === "bitwarden") {
		const items = state.accounts.map((acc) => ({
			type: 1,
			name: acc.issuer
				? `${acc.issuer}: ${acc.name}`
				: acc.name,
			login: { totp: generateUri(acc) },
		}));
		content = JSON.stringify(
			{ encrypted: false, items },
			null,
			2
		);
		mime = "application/json";
		name = `bitwarden_export_${date}.json`;
	} else if (type === "csv") {
		const headers =
			"name,secret,issuer,type,algorithm,digits,period,uri\n";
		const rows = state.accounts
			.map((acc) => {
				const n = `"${(acc.name || "").replace(
					/"/g,
					'""'
				)}"`;
				const i = `"${(acc.issuer || "").replace(
					/"/g,
					'""'
				)}"`;
				return `${n},${acc.secret},${i},${acc.type},${
					acc.algo
				},${acc.digits},30,"${generateUri(acc)}"`;
			})
			.join("\n");
		content = headers + rows;
		mime = "text/csv";
		name = `otp_export_${date}.csv`;
	} else if (type === "txt") {
		content = state.accounts
			.map((acc) => generateUri(acc))
			.join("\n");
		mime = "text/plain";
		name = `otp_uris_${date}.txt`;
	}

	const blob = new Blob([content], { type: mime });
	const a = document.createElement("a");
	a.href = URL.createObjectURL(blob);
	a.download = name;
	a.click();
	closeModal("exportModal");
	showToast(t("toastExportSuccess"), "success");
};

// === Utils ===
let confirmCallback = null;

window.showConfirm = (title, message, callback) => {
	document.getElementById("confirmTitle").textContent = title;
	document.getElementById("confirmMessage").textContent = message;
	confirmCallback = callback;
	openModal("confirmModal");
};

window.handleConfirm = () => {
	if (confirmCallback) {
		confirmCallback();
		confirmCallback = null;
	}
	closeModal("confirmModal");
};

window.removeAccount = (i) => {
	showConfirm(t("confirmDelete"), t("confirmDeleteMsg"), () => {
		state.accounts.splice(i, 1);
		saveToIndexedDB(state.accounts);
		renderGrid();
		showToast(t("toastDeleteSuccess"), "success");
	});
};

window.confirmClearAll = () => {
	showConfirm(
		t("confirmClearAll"),
		t("confirmClearAllMsg"),
		() => {
			state.accounts = [];
			clearIndexedDB();
			renderGrid();
			showToast(t("toastClearSuccess"), "success");
		}
	);
};
// === QR Code Functions ===
let currentSecret = "";
window.copySecret = () => {
	const done = () => showToast(t("toastCopied"), "success");
	if (navigator.clipboard && window.isSecureContext) {
		navigator.clipboard
			.writeText(currentSecret)
			.then(done)
			.catch(() => fallbackCopyText(currentSecret, done));
	} else {
		fallbackCopyText(currentSecret, done);
	}
};
function fallbackCopyText(text, done) {
	const ta = document.createElement("textarea");
	ta.value = text;
	ta.style.position = "fixed";
	ta.style.opacity = "0";
	document.body.appendChild(ta);
	ta.select();
	try {
		document.execCommand("copy");
		done();
	} catch (e) {
		console.error("复制失败:", e);
	} finally {
		ta.remove();
	}
}
window.showQRCode = (index) => {
	const acc = state.accounts[index];
	currentSecret = acc.secret || "";
	const uri = generateUri(acc);

	try {
		// 使用 qrcode-generator 库
		const qr = qrcode(0, "H"); // 0 = auto-detect, 'H' = high error correction
		qr.addData(uri);
		qr.make();

		// 创建 canvas 并绘制
		const canvas = document.getElementById("qrCanvas");
		const cellSize = 7; // 每个单元格的像素大小
		const margin = 2; // 边距（单元格数量）
		const size = qr.getModuleCount();
		const totalSize = (size + margin * 2) * cellSize;

		canvas.width = totalSize;
		canvas.height = totalSize;
		const ctx = canvas.getContext("2d");

		// 白色背景
		ctx.fillStyle = "#FFFFFF";
		ctx.fillRect(0, 0, totalSize, totalSize);

		// 绘制二维码
		ctx.fillStyle = "#000000";
		for (let row = 0; row < size; row++) {
			for (let col = 0; col < size; col++) {
				if (qr.isDark(row, col)) {
					ctx.fillRect(
						(col + margin) * cellSize,
						(row + margin) * cellSize,
						cellSize,
						cellSize
					);
				}
			}
		}

		// 设置标题和信息
		document.getElementById("qrModalTitle").textContent =
			acc.name || t("qrTitle");
		document.getElementById("qrInfo").innerHTML = `
			<div class="qr-info-row">
				<span class="qr-info-label">${t("qrAccount")}</span>
				<span class="qr-info-value">${esc(acc.name)}</span>
			</div>
			<div class="qr-info-row">
				<span class="qr-info-label">${t("qrIssuer")}</span>
				<span class="qr-info-value">${esc(acc.issuer || t("qrUnknown"))}</span>
			</div>
			<div class="qr-info-row">
				<span class="qr-info-label">${t("qrType")}</span>
				<span class="qr-info-value">${acc.type.toUpperCase()}</span>
			</div>
			<div class="qr-info-row">
				<span class="qr-info-label">${t("qrAlgo")}</span>
				<span class="qr-info-value">${acc.algo} / ${acc.digits} ${t(
			"digitsUnit"
		)}</span>
			</div>
			<div class="qr-info-row">
				<span class="qr-info-label">${t("qrSecret")}</span>
				<span class="qr-info-value qr-secret-value">${esc(acc.secret)}</span>
				<button class="copy-btn" onclick="copySecret()">${t("copy")}</button>
			</div>
		`;

		openModal("qrModal");
	} catch (error) {
		showToast(t("errorQRGeneration"), "error");
		console.error(error);
	}
};

window.exportQRCodes = async () => {
	if (state.accounts.length === 0) {
		showToast(t("toastNoExport"), "error");
		return;
	}

	closeModal("exportModal");
	openModal("progressModal");

	try {
		const zip = new JSZip();
		const total = state.accounts.length;

		for (let i = 0; i < total; i++) {
			const acc = state.accounts[i];
			updateProgress(
				i + 1,
				total,
				t("progressGenerateQR", { name: acc.name })
			);

			const uri = generateUri(acc);

			// 使用 qrcode-generator 生成高分辨率二维码
			const qr = qrcode(0, "H");
			qr.addData(uri);
			qr.make();

			// 创建高分辨率 canvas
			const canvas = document.createElement("canvas");
			const cellSize = 10; // 更大的单元格用于高分辨率
			const margin = 4;
			const size = qr.getModuleCount();
			const totalSize = (size + margin * 2) * cellSize;

			canvas.width = totalSize;
			canvas.height = totalSize;
			const ctx = canvas.getContext("2d");

			// 白色背景
			ctx.fillStyle = "#FFFFFF";
			ctx.fillRect(0, 0, totalSize, totalSize);

			// 绘制二维码
			ctx.fillStyle = "#000000";
			for (let row = 0; row < size; row++) {
				for (let col = 0; col < size; col++) {
					if (qr.isDark(row, col)) {
						ctx.fillRect(
							(col + margin) * cellSize,
							(row + margin) * cellSize,
							cellSize,
							cellSize
						);
					}
				}
			}

			// 转换为PNG
			const blob = await new Promise((resolve) =>
				canvas.toBlob(resolve, "image/png")
			);

			// 创建安全的文件名
			const safeName = (
				acc.issuer ? `${acc.issuer}_${acc.name}` : acc.name
			)
				.replace(/[<>:"/\\|?*]/g, "_")
				.substring(0, 100);

			zip.file(`${safeName}.png`, blob);

			await new Promise((r) => setTimeout(r, 50));
		}

		updateProgress(total, total, t("progressCompress"));
		const zipBlob = await zip.generateAsync({ type: "blob" });

		const date = new Date().toISOString().slice(0, 10);
		const a = document.createElement("a");
		a.href = URL.createObjectURL(zipBlob);
		a.download = `qrcodes_${date}.zip`;
		a.click();

		setTimeout(() => {
			closeModal("progressModal");
			showToast(
				t("toastQRExportSuccess", { count: total }),
				"success"
			);
		}, 500);
	} catch (error) {
		closeModal("progressModal");
		showToast(t("errorExportFailed"), "error");
		console.error(error);
	}
};

window.openModal = (id) =>
	document.getElementById(id).classList.add("show");
window.closeModal = (id) =>
	document.getElementById(id).classList.remove("show");
window.processManual = () => {
	const input = document.getElementById("manualInput");
	const v = input.value.trim();

	if (!v) {
		showToast(t("toastInvalidInput"), "error");
		return;
	}

	try {
		const accounts = parseProtobuf(v);
		if (accounts && accounts.length > 0) {
			mergeAccounts(accounts);
			renderGrid();
			closeModal("manualModal");
			input.value = "";
			showToast(
				t("toastParseSuccess", { count: accounts.length }),
				"success"
			);
		} else {
			showToast(t("toastNoAccounts"), "error");
		}
	} catch (e) {
		console.error("手动解析失败:", e);
		const errorMsg = e.message || t("errorProtobuf");
		showToast(errorMsg, "error");
	}
};
function updateProgress(current, total, msg) {
	document.getElementById("progressFill").style.width =
		Math.round((current / total) * 100) + "%";
	document.getElementById("progressText").textContent = t(
		"progressStatus",
		{
			current,
			total,
			msg,
		}
	);
}
function showToast(msg, type) {
	const t = document.createElement("div");
	t.className = `toast ${type}`;
	t.textContent = msg;
	document.getElementById("toastContainer").appendChild(t);
	setTimeout(() => t.remove(), 3000);
}
function getIcon(acc) {
	const k = (acc.issuer + acc.name).toLowerCase();
	if (k.includes("git")) return ICONS.github;
	if (k.includes("goog")) return ICONS.google;
	if (k.includes("aws")) return ICONS.aws;
	return ICONS.default;
}
function esc(s) {
	return s ? s.replace(/&/g, "&amp;").replace(/</g, "&lt;") : "";
}

// === Page Initialization ===
async function init() {
	// 检测并设置语言
	currentLang = detectLanguage();
	updateUILanguage();

	try {
		// 初始化 IndexedDB
		await initDB();

		// 尝试从 IndexedDB 恢复数据
		const savedAccounts = await loadFromIndexedDB();
		if (savedAccounts && savedAccounts.length > 0) {
			state.accounts = savedAccounts;
			renderGrid();
			showToast(
				t("toastRecovered", {
					count: savedAccounts.length,
				}),
				"success"
			);
		}

		// 添加模态框点击外部关闭功能
		const modals = ["exportModal", "manualModal", "qrModal"];
		modals.forEach((modalId) => {
			const overlay = document.getElementById(modalId);
			if (overlay) {
				overlay.addEventListener("click", (e) => {
					if (e.target === overlay) {
						closeModal(modalId);
					}
				});
			}
		});
	} catch (error) {
		console.error("初始化失败:", error);
	}
}

// 页面加载时初始化
if (document.readyState === "loading") {
	document.addEventListener("DOMContentLoaded", init);
} else {
	init();
}
