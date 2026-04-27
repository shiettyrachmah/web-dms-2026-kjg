//debugger;
const dropZone2 = document.getElementById("drop_zone_template_ext");
const fileInput2 = document.getElementById("file_upload_template_ext");
const errorFile2 = document.getElementById("uploadTemplateErrorExt");
const fileNameDisplay2 = document.getElementById("file_name_template_ext");

let btnCloseUploadMulti = document.getElementById("btnCloseTambahExtBulk");
btnCloseUploadMulti.style.display = "none";

fileInput2.addEventListener("change", (e) => {
	if (!e.target.files.length) return;

	let file = e.target.files[0];
	$("#excel_preview").html("");
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
		$("#btnCloseTambahExtBulk").removeClass("d-none");
	} else {
		fileNameDisplay2.textContent = "📄 " + file.name;
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

		fileNameDisplay2.textContent = "📄 " + files[0].name;
		btnCloseUploadMulti.style.display = "inline";

		readExcelFile(files[0]);
	}
});

//event click
$("#drop_zone_template_ext").on("click", function () {
	$("#file_upload_template_ext").click();
});

$("#btnCloseUploadMulti").click(function (e) {
	e.preventDefault();

	fileInput2.value = "";
	fileNameDisplay2.textContent = "";
	btnCloseUploadMulti.style.display = "none";

	$("#excel_preview").html("");
});

$("#btnSimpanExtMulti").click(function () {
	let emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	let emails = {};
	let isInvalid = false;
	let datas = [];

	$("#detail_file_excel_external tbody tr").each(function () {
		let row = $(this);

			let emailCell = row.find("td:eq(2)");
			let statusCell = row.find("td:eq(3)");

			let email = emailCell.text().trim();

			// reset dulu
			statusCell.text("").removeClass("text-danger text-success");
	
			if (email === "") {
				statusCell.text("Email kosong");
				statusCell.addClass("text-danger");
				isInvalid = true;
				return;
			}

			if (!emailRegex.test(email)) {
				statusCell.text("Format email tidak valid");
				statusCell.addClass("text-danger");
				isInvalid = true;
				return;
			}

			if (emails[email]) {
				statusCell.text("Duplikat email");
				statusCell.addClass("text-danger");
				isInvalid = true;
				return;
			}

			// jika valid
			emails[email] = true;
			statusCell.text("Valid.");
			statusCell.addClass("text-success");

			datas.push({
				name: row.find("td:eq(1)").text().trim(),
				email: row.find("td:eq(2)").text().trim()
			});
		

	});

	if (isInvalid) {
		alert("Mohon perbaiki data terlebih dahulu. Masih ada data tidak valid!");
		return;
	}

	//kirim ajax
	var dataSend = {
		created_by: "",
		user_ext_bulky: datas
	};

	let resMap = {};
	showLoadingSwal();

	$.ajax({
		url: WebUrl + "/UsersExternal/CreateBulk",
		type: "POST",
		contentType: "application/json",
		data: JSON.stringify(dataSend),
		success: function (res) {
			res.forEach(item => {
				resMap[item.email] = item;
			});

			$("#detail_file_excel_external tbody tr").each(function () {
				let row = $(this);
				let emailCell = row.find("td:eq(2)");
				let statusCell = row.find("td:eq(3)");
				let email = emailCell.text().trim();
				if (resMap[email]) {
					let statusText = resMap[email].status;
					if (statusText.includes("Failed")) {
						statusCell.html(`<span class="text-danger">${statusText}</span>`);
					} else {
						statusCell.html(`<span class="text-success">${statusText}</span>`);
					}
				}
			});

			$('#table-users-external').DataTable().ajax.reload();
		},
		error: function () {
			Swal.fire({
				icon: "error",
				title: "Gagal!",
				text: "Terjadi Kesalahan dalam menyimpan."
			});
		},
		complete: function () {
			hideLoadingSwal();
			resetUploadProgress();
		}
	});

});

//function
function displayExcelData(excel_fixed_rows, sheetName) {
	$("#excel_preview").html("");

	if (!excel_fixed_rows || excel_fixed_rows.length === 0) {
		excelPreview.append(`<p class='text-danger'>Sheet ${sheetName} kosong</p>`);
		return;
	}


	let html = `
		<h5 class="mt-4">${sheetName}</h5>
		<div class="table-responsive mb-4" style="max-height: 200px; overflow-y: auto;">
			<table class="table table-bordered table-sm" id="detail_file_excel_external">
				<thead>
					<tr>
						<th>No</th>
						<th>Nama</th>
						<th>Email</th>
						<th>Validasi Data</th>
					</tr>
				</thead>
				<tbody>
	`;

	excel_fixed_rows.forEach((row_excel, index) => {

		if (index === 0) return; 

		if (!row_excel) return;

		row_excel = Array.isArray(row_excel) ? row_excel : [row_excel];

		const isEmptyRow = row_excel.every(cell =>
			cell === null || cell === undefined || cell.toString().trim() === ""
		);

		if (isEmptyRow) return;

		html += `<tr>
			<td>${row_excel[0] ?? ""}</td>
			<td>${row_excel[1] ?? ""}</td>
			<td>${row_excel[2] ?? ""}</td>
			<td class="status-cell"></td>
		</tr>`;
	});

	html += `
				</tbody>
			</table>
		</div>
	`;

	excelPreview.append(html);
}

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
			//displayExcelDetailDokIndek(excel_fixed_rows, sheetName);
		});

	};

	readerExcel.readAsArrayBuffer(file);
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
