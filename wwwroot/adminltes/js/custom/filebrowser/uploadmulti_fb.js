//declare
let excelPreview = $("#excel_preview");
let detail_dok_indek = [];

//upload file template
const dropZone2 = document.getElementById("drop_zone_template");
const fileInput2 = document.getElementById("file_upload_template");
const errorFile2 = document.getElementById("uploadTemplateError");
const fileNameDisplay2 = document.getElementById("file_name_template");
const btnCloseUploadMulti = document.getElementById("btnCloseUploadMulti");

btnCloseUploadMulti.style.display = "none";
dropZone2.addEventListener("click", () => fileInput2.click());

fileInput2.addEventListener("change", (e) => {
	$("#excel_preview").html("");
	let file = e.target.files[0];
	const maxSize = maxSizes;
	const fileSize = file.size;
	const allowedExtensions = ["xlsx"];
	const fileExt = e.target.files[0].name.split(".").pop().toLowerCase();

	if (fileSize > maxSize) {
		valid = false;
		dropZone2.classList.add("is-invalid");
		errorFile2.textContent = `Ukuran file maksimal ${maxSizesMB} MB.`;
		errorFile2.style.display = "block";
	} else if (!allowedExtensions.includes(fileExt)) {
		valid = false;
		dropZone2.classList.add("is-invalid");
		errorFile2.textContent = "File tidak valid. Extensi file harus Excel. Silahkan download file template dan input data";
		errorFile2.style.display = "block";
	} else {
		uploadedFileName.textContent = "📄 " + file.name;
		btnCloseUploadMulti.style.display = "inline";
		dropZone2.classList.remove("is-invalid");
		errorFile2.textContent = "";
		errorFile2.style.display = "none";
		readExcelFile(file);
	}
});

dropZone2.addEventListener("dragover", (e) => {
	e.preventDefault();
	dropZone2.classList.add("dragover");
});

dropZone2.addEventListener("dragleave", (e) => {
	e.preventDefault();
	dropZone2.classList.remove("dragover");
});

dropZone2.addEventListener("drop", (e) => {
	e.preventDefault();
	dropZone2.classList.remove("dragover");

	const files = e.dataTransfer.files;
	if (files.length > 0) {
		fileInput2.files = files;

		uploadedFileName.textContent = "📄 " + files[0].name;
		btnCloseUploadMulti.style.display = "inline";

		readExcelFile(files[0]);
	}
});

//event click
$("#btnCloseUploadMulti").click(function (e) {
	e.preventDefault();

	fileInput2.value = "";
	fileNameDisplay2.textContent = "";
	btnCloseUploadMulti.style.display = "none";

	$("#excel_preview").html("");
});


//function
function readExcelFile(file) {
	let allowedSheet = ['Detail File'];

	let readerExcel = new FileReader();

	readerExcel.onload = function (e) {
		let data_excel = new Uint8Array(e.target.result);
		let workbook = XLSX.read(data_excel, { type: "array" });

		workbook.SheetNames.forEach(sheetName => {

			if (!allowedSheet.includes(sheetName)) {
				return;
			}

			const sheet = workbook.Sheets[sheetName];
			const excel_rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
			const excel_fixed_rows = fixExcelRows(excel_rows);

			displayExcelData(excel_fixed_rows, sheetName);
			displayExcelDetailDokIndek(excel_fixed_rows, sheetName);
		});

	};

	readerExcel.readAsArrayBuffer(file);
}

// 🔥 Tampilkan Excel ke HTML
function displayExcelData(excel_fixed_rows, sheetName) {
	if (!excel_fixed_rows || excel_fixed_rows.length === 0) {
		excelPreview.append(`<p class='text-danger'>Sheet ${sheetName} kosong</p>`);
		return;
	}

	let html = `
					<h5 class="mt-4">${sheetName}</h5>
					<div class="table-responsive mb-4" id="detail_file_excel" style="max-height: 200px; overflow-y: auto;">
						<table class="table table-bordered table-sm">
				`;

	let nameFilesExcel = [];

	excel_fixed_rows.forEach((row_excel, indek) => {

		if (!nameFilesExcel.includes(row_excel)) {

			row_excel = Array.isArray(row_excel) ? row_excel : [row_excel];

			let namaFileExcl = row_excel[1];
			html += "<tr>";

			if (indek !== 0) {
				if (nameFilesExcel.includes(namaFileExcl)) {
					return; // abaikan baris ini
				}

				nameFilesExcel.push(namaFileExcl);
			}

			html += "<tr>";

			row_excel.forEach((col_excel, indekcol) => {
				if (indekcol < 4) {
					html += `<td>${col_excel ?? ""}</td>`;
				}
			});

			if (indek === 0) {
				html +=
					`<td></td>`;
			}

			if (indek !== 0 && row_excel.length > 0) {
				html +=
					`<td class="drop-zone border border-2 border-primary rounded p-1 text-center position-relative">
									<i class="fas fa-cloud-upload-alt fa-2x text-primary mb-2"></i>
									<p class="mb-0">Klik atau seret file untuk merubah file</p>
									<input type="file"
										   name="file_upload_filemulti"
										   class="file-upload-multifile position-absolute top-0 start-0 w-100 h-100 opacity-0"
										   data-indeknamafile="${namaFileExcl}" />
													<div class="upload-error text-danger small mt-1 d-none"></div>
									  <div class="uploaded-file-name small text-muted mt-1"></div>
								</td>`;
			}

			html += "</tr>";
		}

	});

	html += "</table></div>";

	excelPreview.append(html);
	attachRowUploadEvent();
	attachDropzoneEvent();
}

//digunakan untuk hit file jika di drop, change dll agar hit langsung ke api
function attachDropzoneEvent() {
	document.querySelectorAll('.drop-zone').forEach(zone => {

		zone.addEventListener('dragover', function (e) {
			e.preventDefault();
			this.classList.add('dragover');
		});

		zone.addEventListener('dragleave', function () {
			this.classList.remove('dragover');
		});

		zone.addEventListener('drop', function (e) {
			e.preventDefault();
			this.classList.remove('dragover');

			const files = e.dataTransfer.files;
			if (!files || files.length === 0) return;

			const input = this.querySelector('.file-upload-multifile');

			// Set file ke input
			input.files = files;

			// Trigger event change supaya logic lama kepakai
			const event = new Event('change', { bubbles: true });
			input.dispatchEvent(event);
		});
	});
}

function attachRowUploadEvent() {
	document.querySelectorAll('.file-upload-multifile').forEach(input => {
		input.addEventListener('change', function (e) {

			const tr = e.target.closest("tr");

			const file = e.target.files[0];

			const key = e.target.dataset.indeknamafile;

			if (!file) return;

			const dropZone = $(this).closest(".drop-zone");
			const error = dropZone.find(".upload-error");
			const fileName = dropZone.find(".uploaded-file-name");

			dropZone.addClass("is-invalid");
			error.removeClass("d-none").text("");

			fileName.text("📄 " + file.name);

			const maxSize = maxSizes;
			const fileSize = file.size;

			const allowedExtensions = allowedExts
				? allowedExts.split(",").map(x => x.trim().toLowerCase())
				: [];

			const fileExt = file.name.split(".").pop().toLowerCase();

			dropZone.removeClass("is-invalid");
			error.addClass("d-none").text("");

			if (fileSize > maxSize) {
				dropZone.addClass("is-invalid");
				error.removeClass("d-none").text(`Ukuran file maksimal ${maxSizesMB} MB.`);
				return;
			}

			if (!allowedExtensions.includes(fileExt) || fileExt === "html") {
				dropZone.addClass("is-invalid");
				error.removeClass("d-none").text(`File tidak valid. File diizinkan: ${allowedExts}`);
				return;
			}


			const parentId = e.target.closest("td");
			parentId.classList.add("uploading");
			parentId.innerHTML = `<div class="progress mb-1">
								<div class="progress-bar progress-bar-striped progress-bar-animated"
									 style="width:0%"></div>
							</div>
							<span class="text-primary">Uploading . . .</span>`;

			const namaFileExcel = tr.querySelector("td:nth-child(2)")?.textContent.trim();
			const tglExpExcel = tr.querySelector("td:nth-child(3")?.textContent.trim();
			const tipeDokExcel = tr.querySelector("td:nth-child(4")?.textContent.trim();

			const table2 = document.querySelector("#detail_file_excel_2");
			if (!table2) {
				return;
			}

			let docIndxval = [];
			const datastable2 = detail_dok_indek.filter(x => x.namadoc == key);
			datastable2.forEach(item => {
				let id_indices = item.dokIndek?.trim() ? parseInt(item.dokIndek.split(" - ")[0]) || 0 : 0;
				docIndxval.push({
					document_index_id: id_indices,
					value: item.dokIndekValue
				});
			});

			let formData = new FormData();
			if (file) {
				formData.append("file_upload", file);
			}

			formData.append("name", namaFileExcel);
			formData.append("document_type_id", tipeDokExcel.split("-")[0]);
			formData.append("directories_id", $("#directories_id").val());
			formData.append("version_number", "1");
			formData.append("expired_at", tglExpExcel);
			formData.append("path", $("#activeFolder").text());
			formData.append("created_by", "");
			formData.append("docIndxval", JSON.stringify(docIndxval));
			uploadFilePerRow(parentId, formData);

		});
	});
}

function displayExcelDetailDokIndek(excel_fixed_rows, sheetName) {
	detail_dok_indek = [];
	sheetName = "Detail Dokumen Indek";

	if (!excel_fixed_rows || excel_fixed_rows.length === 0) {
		excelPreview.append(`<p class='text-danger'>Sheet ${sheetName} kosong</p>`);
		return;
	}

	let html = `
					<h5 class="mt-4">${sheetName}</h5>
					<div class="table-responsive mb-4"  id="detail_file_excel_2" style="max-height: 150px; overflow-y: auto;">
						<table class="table table-bordered table-sm">
				`;

	excel_fixed_rows.forEach((row_excel, indek) => {
		row_excel = Array.isArray(row_excel) ? row_excel : [row_excel];
		html += "<tr>";

		const rowObj = {
			id: row_excel[0] ?? "",
			namadoc: row_excel[1] ?? "",
			tgl: row_excel[2] ?? "",
			tipe: row_excel[3] ?? "",
			dokIndek: row_excel[4] ?? "",
			dokIndekValue: row_excel[5] ?? ""
		};

		detail_dok_indek.push(rowObj);

		row_excel.forEach((col_excel, indek) => {
			let colindekchoose = [1, 4, 5, 6];
			if (colindekchoose.includes(indek)) {
				html += `<td>${col_excel ?? ""}</td>`;
			}
		});

		html += "</tr>";
	});

	html += "</table></div>";

	excelPreview.append(html);
}


function uploadFilePerRow(parentId, formData) {
	let filenames = formData.get("name");

	$.ajax({
		url: WebUrl + "/FileBrowser/UploadFileDoc",
		type: "POST",
		data: formData,
		processData: false,
		contentType: false,   //set multipart/form-data
		xhr: function () {
			let xhr = new window.XMLHttpRequest();

			xhr.upload.addEventListener("progress", function (e) {
				if (e.lengthComputable) {
					let percent = (e.loaded / e.total) * 100;
					parentId.querySelector(".progress-bar").style.width = percent + "%";
				}
			});

			return xhr;
		},
		success: function (res) {
			reloadTree(res.data);
			const indek = $("#indek_tree").val();
			collapseCurrentId(res.newdirid, indek);
			allDataTrees = res.data;
			document.getElementById("activeFolder").innerText = document.getElementById("name_folder_add").innerText;
			let dirids = res.newdirid;

			if (allDataTrees.filter(x => x.dirid == dirids).length > 0) {
				reloadTableFile(dirids, parseInt(indek, 10));
			}

			parentId.innerHTML = `
						<span class="text-success">
							✔ ${filenames} berhasil diupload
						</span>
						`;

			expandAllTree();
			$(".tooltip").remove();
		},
		error: function () {
			parentTd.innerHTML = `
						<span class="text-danger">
							✖ Upload gagal
						</span><br>
						<small>Pilih ulang file</small>
					`;
		}
	});
}

function isExcelDate(value) {
	return typeof value === "number" && value > 40000 && value < 60000;
}

function excelSerialToDate(serial) {
	const utc_days = Math.floor(serial - 25569);
	const utc_value = utc_days * 86400;
	const date_info = new Date(utc_value * 1000);
	return date_info.toISOString().split("T")[0];
}

function fixExcelRows(rows) {
	return rows.map((row, idx) => {
		if (idx === 0) return row;

		return Array.from(row, col => {
			if (isExcelDate(col)) {
				return excelSerialToDate(col);
			}
			if (col === undefined || col === null) {
				return "";
			}
			return col;
		});
	});
}
