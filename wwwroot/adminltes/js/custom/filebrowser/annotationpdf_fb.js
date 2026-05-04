
let currentPdfBlobUrl = "";
let activeText = null;
let cursorIndex = 0;
let isEditingComment = false;
let cursorRect = null;
let cursorTimer = null;
let cursorLine;
let cursorBlinkInterval;

//set value
let markerSize = 20;
let currentFontSize = 20;
let mode = "draw";
let stageCache = {};
let currentColor = "#0008ff";
let currentAlign = "left";
let isDrawing = false;
let line = null;
let historyStack = {};
let redoStack = {};
let lastPoint = null;
let isEditingText = false;
let selectedRect = null;
let isRemoved = false;
//debugger;

window.pdfState = {
	currentPage: 1,
	totalPages: 0
};

window.allAnnotations = [];
window.stageCache = {};
window.annotationImages = [];
window.isAnnotateActive = true;

//debugger;
$("#btnAnnotate").click(async function () {

	$("#previewContainer").hide();
	$("#annotationContainer").show();

	let docVerId = $("#doc_ver_id").val();

	await loadPdfForAnnotation(currentPdfBlobUrl);
	getDataAnnotationByDocVer(docVerId);
	loadAnnotationHistory(docVerId);
	$("#btnAnnotate").addClass("d-none");
});

$('#modalPreviewFile').on('hidden.bs.modal', function () {
	$('.modal-backdrop.stacked').remove();

	$('body').addClass('modal-open');

	$('#modalAddVersion').css('z-index', '');

	//reset pdf
	$("#pdfViewer").html("");
	$("#pdfFrame").attr("src", "").hide();
	$("#textViewer").hide().text("");
	$("#imgViewer").hide().attr("src", "");

	if (window.currentPdfBlobUrl) {
		URL.revokeObjectURL(window.currentPdfBlobUrl);
		window.currentPdfBlobUrl = null;
	}
});

$("#btnCloseAnnotate").click(function () {

	// 🔥 MATIKAN SEMUA AKTIVITAS
	window.isAnnotateActive = false;

	// 🔥 destroy transformer dulu
	if (window.annotateTransformers) {
		window.annotateTransformers.forEach(tr => {
			if (tr) {
				tr.nodes([]);
				tr.destroy();
			}
		});
	}

	// 🔥 destroy semua stage
	if (Konva.stages) {
		Konva.stages.forEach(s => {
			if (s) s.destroy();
		});
		Konva.stages.length = 0;
	}

	// 🔥 reset semua reference
	window.annotateStages = null;
	window.annotateLayers = null;
	window.annotateTransformers = null;

	$("#previewContainer").show();
	$("#annotationContainer").hide();
	$("#btnAnnotate").removeClass("d-none");
});

$("#fontSizeSelect").on("change", function () {

	currentFontSize = parseInt($(this).val());

	if (activeText) {

		activeText.fontSize(currentFontSize);
		activeText.getLayer().draw();

		let stage = activeText.getStage();
		let page = pdfState.currentPage;

		saveHistory(stage, page);
	}
});

window.addEventListener("keydown", function (e) {
	if (!activeText || isEditingText) return;

	let txt = activeText.text();

	if (e.key === "Backspace") {
		if (cursorIndex > 0) {
			txt = txt.slice(0, cursorIndex - 1) + txt.slice(cursorIndex);
			cursorIndex--;
		}
	}
	else if (e.key === "Enter") {
		txt = txt.slice(0, cursorIndex) + "\n" + txt.slice(cursorIndex);
		cursorIndex++;
	}
	else if (e.key === "ArrowLeft") {
		cursorIndex = Math.max(0, cursorIndex - 1);
		updateCursorPosition();
		return;
	}
	else if (e.key === "ArrowRight") {
		cursorIndex = Math.min(txt.length, cursorIndex + 1);
		updateCursorPosition();
		return;
	}
	else if (e.key.length === 1) {
		txt = txt.slice(0, cursorIndex) + e.key + txt.slice(cursorIndex);
		cursorIndex++;
	}

	activeText.text(txt);
	updateCursorPosition();
});

$("#pdfViewer").on("scroll", function () {
	if (isEditingText) return;
	let containerRect = this.getBoundingClientRect();

	let bestPage = null;
	let maxRatio = 0;

	$(".pdfPage").each(function () {

		let page = $(this).data("page");
		let rect = this.getBoundingClientRect();

		let visibleHeight =
			Math.min(rect.bottom, containerRect.bottom) -
			Math.max(rect.top, containerRect.top);

		let height = rect.height;

		let visibleRatio = visibleHeight > 0 ? visibleHeight / height : 0;

		// 🔥 cari yang paling kelihatan
		if (visibleRatio > maxRatio) {
			maxRatio = visibleRatio;
			bestPage = page;
		}
	});

	if (bestPage && pdfState.currentPage != bestPage) {
		pdfState.currentPage = bestPage;
		console.log("Current page:", bestPage);
	}
});

$("#btnInsertImage").on("click", function (e) {
	e.preventDefault();
	$("#imageUploader").trigger("click");
});

$("#imageUploader").on("change", function (e) {

	let file = e.target.files[0];
	if (!file) return;

	let reader = new FileReader();

	reader.onload = function (ev) {

		let img = new Image();

		img.onload = function () {

			let page = pdfState.currentPage;
			let layer = window.annotateLayers[page];
			let stage = window.annotateStages[page];
			//let tr = window.annotateTransformers[page];
			//let tr = window.annotateTransformers[String(page)];

			let imageId = generateImageId();

			let konvaImage = new Konva.Image({
				x: stage.width() / 2 - 100,
				y: stage.height() / 2 - 100,
				width: 200,
				height: 200,
				image: img,
				draggable: true,
				name: "annotationImage",
				imageId: imageId,
				page: page,
			});

			window.annotationImages.push({
				imageId: imageId,
				imageBase64: ev.target.result,
				page: page
			});

			layer.add(konvaImage);

			// select image
			enableImageEditor(konvaImage, layer, page);

			// ✅ ambil transformer dengan key string (fix bug paling sering)
			const key = String(page);
			let tr = window.annotateTransformers[key];

			if (!tr) {
				console.error("TR NOT FOUND", key);
				return;
			}

			// attach ke image
			tr.nodes([konvaImage]);

			// paksa kelihatan (debug style)
			tr.setAttrs({
				borderStroke: "red",
				borderStrokeWidth: 2,
				anchorStroke: "red",
				anchorFill: "white",
				anchorSize: 10
			});

			// pastikan di atas
			tr.moveToTop();

			// render
			layer.batchDraw();

			// resize fix
			konvaImage.on("transformend", function () {

				const scaleX = this.scaleX();
				const scaleY = this.scaleY();

				this.width(this.width() * scaleX);
				this.height(this.height() * scaleY);

				this.scaleX(1);
				this.scaleY(1);

			});

			// select kembali saat diklik
			konvaImage.on("click tap", function (e) {

				e.cancelBubble = true;
				tr.nodes([this]);
				layer.draw();

			});

			//layer.draw();

			//saveHistory(stage, page);

			// reset input file
			$("#imageUploader").val("");
		}

		img.src = ev.target.result;
	}

	reader.readAsDataURL(file);

});

//

function enableImageEditor(node, layer, page) {

	node.on("click tap", function (e) {

		e.cancelBubble = true;

		console.log("✅ attach transformer to image (RESTORE)");

		// 🔥 1. HAPUS semua transformer lama di layer
		layer.find("Transformer").forEach(tr => tr.destroy());

		// 🔥 2. BUAT transformer baru
		let tr = new Konva.Transformer({
			borderStroke: "red",
			borderStrokeWidth: 2,
			anchorStroke: "red",
			anchorFill: "white",
			anchorSize: 10
		});

		layer.add(tr);

		// 🔥 3. attach ke node yang diklik
		tr.nodes([node]);

		tr.moveToTop();

		layer.draw();

		// (optional) simpan reference kalau masih dipakai
		window.annotateTransformers[String(page)] = tr;
	});

	node.on("transformend", function () {

		const scaleX = this.scaleX();
		const scaleY = this.scaleY();

		this.width(this.width() * scaleX);
		this.height(this.height() * scaleY);

		this.scaleX(1);
		this.scaleY(1);

		//setTimeout(() => {
		//	saveHistory(this.getStage(), page);
		//}, 0);
	});
}
function setupKonvaTools(stage, layer, pageNum) {

	//console.log("Transformer created for page:", pageNum);

	const tr = createTransformer(layer, pageNum);
	// simpan kalau perlu
	window.annotateLayers[pageNum] = layer;
	window.annotateStages[pageNum] = stage;

	let isDrawing = false;
	let line;


	stage.on("pointerdown", (e) => {
		if (isEditingText) return;

		let target = e.target;

		// ✅ kalau klik object (group/text/image) → jangan ganggu
		if (target !== stage) return;

		const pos = stage.getRelativePointerPosition();


		if (mode === "draw") {

			isDrawing = true;

			line = new Konva.Line({
				points: [pos.x, pos.y],
				stroke: currentColor,
				strokeWidth: 2,
				lineCap: "round",
				lineJoin: "round",
				draggable: true
			});

			layer.add(line);
			return;
		}

		if (mode === "marker") {

			isDrawing = true;

			line = new Konva.Line({
				points: [pos.x, pos.y],
				stroke: currentColor,
				strokeWidth: 20,
				lineCap: "round",
				lineJoin: "round",
				opacity: 0.25,
				globalCompositeOperation: "multiply",
				draggable: true
			});

			layer.add(line);
			return;
		}

		if (mode === "text") {

			const text = new Konva.Text({
				x: pos.x,
				y: pos.y,
				text: "Double click to edit",
				fontSize: currentFontSize,
				fill: currentColor,
				align: currentAlign,
				draggable: true
			});

			layer.add(text);
			layer.draw();

			activeText = text;
			$("#fontSizeSelect").val(text.fontSize());

			enableTextEditor(text, layer, tr);

			//saveHistory(stage, pageNum);

			setMode("select");
		}

		if (mode === "comment") {

			const group = new Konva.Group({
				x: pos.x,
				y: pos.y,
				draggable: true,
				listening: true
			});

			const bubble = new Konva.Circle({
				radius: 12,
				fill: "#ffcc00",
				stroke: "#333",
				strokeWidth: 2
			});

			const icon = new Konva.Text({
				text: "💬",
				fontSize: 14,
				offsetX: 7,
				offsetY: 7
			});

			const commentText = new Konva.Text({
				name: "commentText",
				text: "Double click to comment",
				y: 18,
				fontSize: 16,
				fill: "#000",
				width: 200,
				//visible: false,
				background: "yellow",
				opacity: 0
			});

			group.add(bubble);
			group.add(icon);
			group.add(commentText);

			layer.add(group);
			layer.draw();

			enableCommentEditor(group, layer);

			//saveHistory(stage, pageNum);

			setMode("select");
		}

		if (mode === "rectangle") {

			const rect = new Konva.Rect({
				x: pos.x,
				y: pos.y,
				width: 200,
				height: 150,
				stroke: currentColor,
				strokeWidth: 2,
				draggable: true,
				name: "imageFrame"
			});

			layer.add(rect);
			layer.draw();

			rect.on("click", function () {

				selectedRect = rect;

				$("#btnInsertImage").show();

			});

			//saveHistory(stage, pageNum);

			setMode("select");
		}
	});

	stage.on("pointermove", () => {

		if (!isDrawing || !line) return;

		const pos = stage.getRelativePointerPosition();

		if (!lastPoint) {
			lastPoint = pos;
			return;
		}

		let dist = Math.sqrt(
			Math.pow(pos.x - lastPoint.x, 2) +
			Math.pow(pos.y - lastPoint.y, 2)
		);

		if (dist < 3) return;

		line.points([...line.points(), pos.x, pos.y]);

		lastPoint = pos;

		layer.batchDraw();

	});

	stage.on("pointerup pointerleave", () => {

		lastPoint = null;

		//if (line) {
		//	saveHistory(stage, pageNum);
		//}

		isDrawing = false;
		line = null;

	});

	//stage.on("dragend", () => {
	//	saveHistory(stage, pageNum);
	//});

	//stage.on("transformend", () => {
	//	saveHistory(stage, pageNum);
	//});

	stage.on("click", function (e) {
		if (isEditingText) return;

		const key = String(pageNum);
		let tr = window.annotateTransformers[key];

		if (!tr) return;

		if (e.target === stage) {
			tr.nodes([]);
			layer.draw();
		}
	});
	}

function enableCommentEditor(group, layer) {

	group.on("mouseenter", function () {
		if (isEditingComment) return;

		let textNode = group.findOne(node =>
			node.getClassName() === "Text" &&
			node.name() === "commentText"
		);

		if (!textNode) return;

		// 🔥 ANIMASI MASUK
		textNode.to({
			opacity: 1,
			duration: 0.15
		});

		layer.draw();
	});

	group.on("mouseleave", function () {
		if (isEditingComment) return;

		let textNode = group.findOne(node =>
			node.getClassName() === "Text" &&
			node.name() === "commentText"
		);

		if (!textNode) return;

		// 🔥 ANIMASI KELUAR
		textNode.to({
			opacity: 0,
			duration: 0.15
		});

		layer.draw();
	});

	// 🔥 FIX UTAMA
	group.on("dblclick dbltap", function (e) {

		//console.log("🔥 GROUP DBLCLICK FIXED");
		//console.log("isEditingComment : ", isEditingComment);

		e.cancelBubble = true;

		if (isEditingComment) return;

		let textNode = group.findOne(node =>
			node.getClassName() === "Text" &&
			node.name() === "commentText"
		);

		if (!textNode) {
			//console.warn("❌ commentTextNode not found");
			return;
		}

		enableCommentTextarea(textNode);
	});

	group.on("dblclick", () => console.log("GROUP DBLCLICK"));

}

function createTransformer(layer, page) {
	const tr = new Konva.Transformer({
		rotateEnabled: true,
		ignoreStroke: true,
		borderStroke: "red",
		borderStrokeWidth: 2,
		anchorStroke: "red",
		anchorFill: "white",
		anchorSize: 10,
		flipEnabled: false,
		keepRatio: false,
		centeredScaling: false,

		// 🔥 tambahan penting
		enabledAnchors: [
			"top-left",
			"top-right",
			"bottom-left",
			"bottom-right"
		]
	});

	layer.add(tr);

	//window.annotateTransformers[page] = tr;
	window.annotateTransformers[String(page)] = tr;

	return tr;
}

function enableCommentTextarea(textNode) {
	isEditingComment = true; 

	let stage = textNode.getStage();
	let container = stage.container();

	let textPosition = textNode.absolutePosition();

	let textarea = document.createElement("textarea");

	container.appendChild(textarea);

	textarea.value = textNode.text();

	textarea.style.position = "absolute";
	textarea.style.left = textPosition.x + "px";
	textarea.style.top = textPosition.y + "px";

	textarea.style.width = "220px";
	textarea.style.height = "80px";

	textarea.style.fontSize = textNode.fontSize() + "px";
	textarea.style.border = "1px solid #666";
	textarea.style.padding = "4px";
	textarea.style.background = "white";
	textarea.style.zIndex = 1000;
	textarea.style.resize = "none";

	textarea.style.borderRadius = "6px";
	textarea.style.boxShadow = "0 2px 6px rgba(0,0,0,0.2)";

	textNode.hide();
	stage.draw();

	textarea.focus();

	function removeTextarea() {
		if (isRemoved) return;
		isRemoved = true;

		if (!textNode || textNode.isDestroyed()) {
			area.remove();
			return;
		}

		const layer = textNode.getLayer();
		const stage = textNode.getStage();

		// 🔥 kalau node sudah tidak punya layer → STOP
		if (!layer || !stage) {
			area.remove();
			return;
		}

		textNode.text(area.value);
		textNode.show();

		isEditingText = false;

		area.remove();

		// 🔥 gunakan batchDraw (lebih aman)
		layer.batchDraw();

		window.removeEventListener("click", handleOutsideClick);
	}

	textarea.addEventListener("keydown", function (e) {

		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			removeTextarea();
		}

	});

	textarea.addEventListener("blur", removeTextarea);

}

function setMarkerYellow() {
	currentColor = "#ffff00";
}


function enableTextEditor(textNode, layer, tr) {
	textNode.on("click", (e) => {
		e.cancelBubble = true;

		activeText = textNode;

		$("#fontSizeSelect").val(textNode.fontSize());

		tr.nodes([textNode]);
		layer.draw();
	});

	// EDIT text untuk rename text
	textNode.on("dblclick dbltap", (e) => {
		e.cancelBubble = true;
		enableTextareaEdit(textNode);
	});

	textNode.on("transform", () => {
		textNode.setAttrs({
			width: textNode.width() * textNode.scaleX(),
			scaleX: 1
		});
	});
}

function enableTextareaEdit(textNode) {
	isEditingText = true;
	let stage = textNode.getStage();
	let container = stage.container();

	let textPosition = textNode.absolutePosition();

	let area = document.createElement("textarea");

	// 🔥 TEMPATKAN DI KONVA CONTAINER
	container.appendChild(area);

	area.value = textNode.text();
	area.style.position = "absolute";

	// 🔥 POSISI RELATIVE KE STAGE
	area.style.left = textPosition.x + "px";
	area.style.top = textPosition.y + "px";

	area.style.width = textNode.width() + "px";
	area.style.height = textNode.height() + "px";

	area.style.fontSize = textNode.fontSize() + "px";
	area.style.fontFamily = textNode.fontFamily();

	area.style.border = "1px solid red";
	area.style.padding = "2px";
	area.style.margin = "0px";
	area.style.background = "white";
	area.style.outline = "none";
	area.style.resize = "none";
	area.style.zIndex = 1000;

	textNode.hide();
	stage.draw();

	area.focus();

	function removeTextarea() {

		textNode.text(area.value);
		textNode.show();
		isEditingText = false;

		let stage = textNode.getStage();
		let page = pdfState.currentPage;

		//saveHistory(stage, page);

		area.remove();
		stage.draw();
		window.removeEventListener("click", handleOutsideClick);
	}

	area.addEventListener("keydown", function (e) {
		if (e.key === "Enter" && !e.shiftKey) {
			removeTextarea();
		}

	});

	area.addEventListener("blur", removeTextarea);

	function handleOutsideClick(e) {
		if (e.target !== area) {
			removeTextarea();
		}
	}

	setTimeout(() => {
		window.addEventListener("click", handleOutsideClick);
	});
}

function hideCursor() {
	if (cursorLine) cursorLine.destroy();
	cursorLine = null;
	clearInterval(cursorTimer);
}

function showCursor(textNode) {
	if (cursorLine) cursorLine.destroy();

	cursorLine = new Konva.Line({
		stroke: "black",
		strokeWidth: 2,
		lineCap: "round"
	});

	textNode.getLayer().add(cursorLine);
	updateCursorPosition();
	startCursorBlink();
}

function startCursorBlink() {
	if (cursorBlinkInterval) clearInterval(cursorBlinkInterval);

	let visible = true;
	cursorBlinkInterval = setInterval(() => {
		if (!cursorLine) return;
		cursorLine.visible(visible);
		visible = !visible;
		cursorLine.getLayer().draw();
	}, 500);
}

function updateCursorPosition() {
	if (!activeText || !cursorLine) return;

	const fontSize = activeText.fontSize();
	const lineHeight = fontSize * 1.2;
	const text = activeText.text();
	const pos = activeText.position(); // FIX HERE

	const beforeCursor = text.substring(0, cursorIndex);
	const lines = beforeCursor.split("\n");
	const lineIndex = lines.length - 1;
	const lastLine = lines[lineIndex];

	const span = document.createElement("span");
	span.style.fontSize = fontSize + "px";
	span.style.fontFamily = activeText.fontFamily() || "Arial";
	span.style.whiteSpace = "pre";
	span.style.position = "absolute";
	span.style.visibility = "hidden";
	span.innerText = lastLine;

	document.body.appendChild(span);
	const width = span.offsetWidth;
	document.body.removeChild(span);

	const x = pos.x + width;
	const y = pos.y + lineIndex * lineHeight;

	cursorLine.points([x, y, x, y + fontSize]);
	activeText.getLayer().draw();
}

function getShapesJson(layer) {

	let shapes = layer.getChildren(node => node.getClassName() !== "Transformer");

	let data = shapes.map(node => node.toObject());

	return JSON.stringify(data);
}

function generateImageId() {
	return "IMG_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5);
}

function saveAnnotations() {

	let btn = $("#btnSaveAnnotation");
	let btnHapus = $("#btnRemoveAnnotation");
	let btnClose = $("#btnCloseAnnotate");

	btn.prop("disabled", true);
	btn.text("💾 Saving...");
	btnHapus.prop("disabled", true);
	btnClose.prop("disabled", true);

	let totalPage = Konva.stages.length;
	let completed = 0;

	let currentdocverids = $("#doc_ver_id").val();

	for (let i = 1; i <= totalPage; i++) {

		saveCurrentPageAnnotation(i, currentdocverids, function () {

			completed++;

			if (completed === totalPage) {
				window.annotationImages = [];

				btn.text("✔ Saved");

				setTimeout(function () {
					btn.prop("disabled", false);
					btn.text("💾 Save");
					btnHapus.prop("disabled", false);
					btnClose.prop("disabled", false);
				}, 2000);
			}

		});

	}
}

function saveCurrentPageAnnotation(pageNumber, currentdocverids, callback) {
	const stage = Konva.stages[pageNumber - 1];
	if (!stage) return;

	//const json = stage.toJSON();
	const layer = window.annotateLayers[pageNumber];
	const json = getShapesJson(layer);

	// jika kosong jangan disimpan
	if (!json || json === "[]" || json.length === 0) {
		// console.log("Page", pageNumber, "no annotation, skip save");
		if (callback) callback();
		return;
	}
	let imagesPerPage = window.annotationImages
		.filter(img => img.page === pageNumber);

	let data = {
		document_version_id: currentdocverids,
		page_setup: JSON.stringify({
			width: stage.width(),
			height: stage.height()
		}),
		pages: pageNumber,
		annotation_json: json,
		images: imagesPerPage, // ✅ FIX DISINI
		created_by: ""
	};

	console.log("data save:", data);

	$.ajax({
		url: WebUrl + "/FileBrowser/CreateDocAnnotation",
		method: "POST",
		contentType: "application/json",
		data: JSON.stringify(data),
		success: function (res) {
			//window.annotationImages = [];

			window.annotationHistory = res.data;
			renderHistoryPanel(res.data);

			if (callback) callback();
		}
	});
}

function loadAnnotationHistory(documentVerId) {
	$.ajax({
		url: WebUrl + "/FileBrowser/GetAnnotationHistory/" + documentVerId,
		method: "GET",
		success: function (res) {
			console.log("resp history");
			console.log(res);
			window.annotationHistory = res;
			renderHistoryPanel(res);
		}
	});
}

function renderHistoryPanel(list) {

	let html = "";

	list.forEach((item, index) => {
		let times = new Date(item.created_at).toLocaleDateString("id-ID", {
			day: "numeric",
			month: "short",
			year: "numeric",
			hour: "2-digit",
			minute: "2-digit"
		});

		html += `
		<div class="history-item"
		     onclick="loadHistoryVersion(${index})"
		     style="padding:8px;border-bottom:1px solid #eee;cursor:pointer">

			Page : ${item.pages}<br>
			<small>${item.created_by_name} - ${times}</small>

		</div>
		`;

	});

	$("#historyPanel").html(html);

}

function loadHistoryVersion(index) {

	let row = window.annotationHistory[index];

	let page = row.pages;

	let shapes = JSON.parse(row.annotation_json);

	let layer = window.annotateLayers[page];

	if (!layer) return;

	layer.find(node => node.getClassName() !== "Transformer")
		.forEach(n => n.destroy());

	shapes.forEach(obj => {

		let node = Konva.Node.create(obj);

		node.draggable(true);

		if (node.getClassName() === "Text") {

			//let tr = window.annotateTransformers[page];
			let tr = window.annotateTransformers[String(page)];
			enableTextEditor(node, layer, tr);

		}

		layer.add(node);

	});

	// 🔥 TAMBAHKAN INI
	restoreImages(layer, row.images || []);

	layer.draw();

}

function getDataAnnotationByDocVer(documentVerId) {

	$.ajax({
		url: WebUrl + "/FileBrowser/GetDocAnnotationByDocVerId/" + documentVerId,
		method: "GET",
		success: function (res) {
			console.log("resp getDataAnnotationByDocVer");
			console.log(res);

			res.forEach(row => {

				let page = row.pages;
				let ann = JSON.parse(row.annotation_json);
				let images = row.images || [];

				let layer = window.annotateLayers[page];
				if (!layer) return;

				// 🔥 bersihkan layer (kecuali transformer)
				layer.find(node => node.getClassName() !== "Transformer")
					.forEach(n => n.destroy());

				ann.forEach(obj => {

					let node;

					// 🔥 KHUSUS IMAGE → JANGAN PAKAI Node.create
					if (obj.className === "Image") {

						let imageId = obj.attrs.imageId;
						let imgData = images.find(x => x.imageId === imageId);

						if (!imgData) return;

						let img = new Image();

						img.onload = function () {

							node = new Konva.Image({
								x: obj.attrs.x,
								y: obj.attrs.y,
								width: obj.attrs.width,
								height: obj.attrs.height,
								draggable: true,
								image: img,
								name: "annotationImage",
								imageId: obj.attrs.imageId
							});

							node.setAttr("page", page);

							// ✅ TAMBAHKAN DULU KE LAYER
							layer.add(node);
							node.getLayer().draw(); // 🔥 ini penting banget
							node.moveToTop();

							if (!node.getLayer()) {
								console.warn("Node belum masuk layer");
								return;
							}

							// ✅ BARU enable event
							enableImageEditor(node, layer, page);

							// render
							layer.batchDraw();
						};

						img.src = imgData.imageBase64;

						return; // 🔥 penting, skip Node.create
					}

					// 🔥 selain image tetap pakai ini
					node = Konva.Node.create(obj);

					node.draggable(true);
					layer.add(node);

					// =========================
					// TEXT
					// =========================
					if (node.getClassName() === "Text") {

						//let tr = window.annotateTransformers[page];
						let tr = window.annotateTransformers[String(page)];
						enableTextEditor(node, layer, tr);
					}

					// =========================
					// COMMENT
					// =========================
					if (node.getClassName() === "Group") {

						let children = node.getChildren();

						if (children.length === 3) {

							let textNode = children[2];

							if (textNode.getClassName() === "Text") {

								textNode.opacity(0);
								enableCommentEditor(node, layer);
							}
						}
					}

				});

				layer.draw();
			});
		}
	});
}


function restoreImages(layer, images) {

	layer.find('.annotationImage').forEach(node => {

		let imageId = node.attrs.imageId;

		let imgData = images.find(x => x.imageId === imageId);

		if (!imgData) return;

		let img = new Image();
		img.src = imgData.imageBase64;

		img.onload = function () {
			node.image(img);
			layer.draw();
		};

	});

}

function loadAnnotationForPage(pageNumber) {

	if (!window.allAnnotations || window.allAnnotations.length == 0) return;

	let row = window.allAnnotations.find(x => x.pages == pageNumber);
	if (!row) return;

	let json = JSON.parse(row.annotation_json);

	const stage = window.konvaStages[pageNumber - 1];
	stage.destroyChildren(); // clear empty layer
	Konva.Node.create(json, stage);

	stage.draw();
}

async function loadPdfForAnnotation(pdfUrl) {
	$("#pdfViewer").html(""); // reset

	pdfjsLib.GlobalWorkerOptions.workerSrc =
		"https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

	let pdf = await pdfjsLib.getDocument(pdfUrl).promise;

	for (let page = 1; page <= pdf.numPages; page++) {
		await renderAnnotatePage(pdf, page);
	}

	// console.log("PDF + Konva layers READY");
}


async function renderAnnotatePage(pdf, pageNum) {
	const page = await pdf.getPage(pageNum);
	const scale = 1.5;
	const viewport = page.getViewport({ scale });

	const container = document.createElement("div");
	container.className = "pdfPage"; // ✅ samakan
	container.setAttribute("data-page", pageNum); // ✅ WAJIB
	container.style.position = "relative";
	container.style.marginBottom = "20px";
	container.style.width = viewport.width + "px";

	const pdfCanvas = document.createElement("canvas");
	pdfCanvas.width = viewport.width;
	pdfCanvas.height = viewport.height;
	container.appendChild(pdfCanvas);

	document.getElementById("pdfViewer").appendChild(container);

	await page.render({
		canvasContext: pdfCanvas.getContext("2d"),
		viewport
	}).promise;

	// KONVA DIV
	const stageDiv = document.createElement("div");
	stageDiv.id = "konvaContainer_" + pageNum;
	stageDiv.style.position = "absolute";
	stageDiv.style.top = "0";
	stageDiv.style.left = "0";
	stageDiv.style.width = viewport.width + "px";
	stageDiv.style.height = viewport.height + "px";
	stageDiv.style.pointerEvents = "auto";
	container.appendChild(stageDiv);

	const stage = new Konva.Stage({
		container: stageDiv,
		width: viewport.width,
		height: viewport.height
	});
	stage.attrs.page = pageNum;

	const layer = new Konva.Layer();
	stage.add(layer);

	
	// SAVE GLOBAL
	window.annotateStages[pageNum] = stage;
	window.annotateLayers[pageNum] = layer;
	//console.log("Stage saved:", pageNum);

	setupKonvaTools(stage, layer, pageNum);
	// simpan state awal
	// saveHistory(stage, pageNum);
}

function clearAnnotations() {

	let currentdocverids = $("#doc_ver_id").val();

	var data = {
		created_by: "",
		document_version_id: currentdocverids
	};

	Swal.fire({
		title: "Hapus Annotasi",
		text: "Apakah Anda yakin menghapus semua annotasi?",
		icon: "warning",
		showCancelButton: true,
		confirmButtonColor: "#3085d6",
		cancelButtonColor: "#d33",
		confirmButtonText: "Ya",
		cancelButtonText: "Batal"
	}).then((result) => {

		if (result.isConfirmed) {

			$.ajax({
				url: WebUrl + "/FileBrowser/DelAnnotationByDocVerId",
				method: "POST",
				contentType: "application/json",
				data: JSON.stringify(data),

				success: function (res) {
					Swal.close();

					Konva.stages.forEach((stage, index) => {

						let layer = window.annotateLayers[index + 1];
						if (!layer) return;

						layer.find(node => node.getClassName() !== "Transformer")
							.forEach(n => n.destroy());

						layer.draw();

					});

					Swal.fire({
						icon: "success",
						title: "Annotation berhasil dihapus",
						timer: 1500,
						showConfirmButton: false
					});

					window.annotationHistory = res.data;
					renderHistoryPanel(res.data);

				}
			});

		}

	});
}


function setHighlightColor() {
	currentColor = "#ffff00"; // kuning stabil
}

//function saveHistory(stage, pageNum) {

//	if (!historyStack[pageNum]) {
//		historyStack[pageNum] = [];
//	}

//	if (!redoStack[pageNum]) {
//		redoStack[pageNum] = [];
//	}

//	let json = stage.toJSON();

//	historyStack[pageNum].push(json);

//	if (historyStack[pageNum].length > 50) {
//		historyStack[pageNum].shift();
//	}

//	redoStack[pageNum] = [];
//}

function resetPdf() {
	$("#doc_ver_id").val("");

	if (Konva.stages) {
		Konva.stages.forEach(s => s.destroy());
		Konva.stages.length = 0;
	}

	window.annotateStages = [];
	window.annotateLayers = [];
	window.annotateTransformers = [];

	$("#pdfViewer").html("");

	$("#annotationContainer").hide();
	$("#previewContainer").show();

	$("#pdfFrame").attr("src", "").hide();
	$("#textViewer").hide().text("");
	$("#imgViewer").hide().attr("src", "");

	if (window.currentPdfBlobUrl) {
		URL.revokeObjectURL(window.currentPdfBlobUrl);
		window.currentPdfBlobUrl = null;
	}

	window.mode = "select";

	$("#modalPreviewFile .modal-body").scrollTop(0);
}

function setColor(color) {
	currentColor = color;
}

function setMode(m) {
	mode = m;

	if (mode !== "text") {
		activeText = null;
		hideCursor();
	}
}

function setTextAlign(alignment) {

	currentAlign = alignment;

	if (activeText) {

		activeText.align(alignment);

		let layer = activeText.getLayer();
		layer.draw();

		let stage = activeText.getStage();
		let page = pdfState.currentPage;

		saveHistory(stage, page);
	}
}
