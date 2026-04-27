debugger;
const dropZoneInt = document.getElementById("drop_zone_template_int");
const fileInputInt = document.getElementById("file_upload_template_int");
const errorFileInt = document.getElementById("uploadTemplateErrorInt");
const fileNameDisplayInt = document.getElementById("file_name_template_int");

let btnCloseUploadMultiInt = document.getElementById("btnCloseTambahIntBulk");
btnCloseUploadMultiInt.style.display = "none";

fileInputInt.addEventListener("change", (e) => {
	if (!e.target.files.length) return;

	let fileint = e.target.files[0];
	$("#excel_preview_int").html("");
	const maxSizeInt = maxSizes;
	const fileSizeInt = fileint.size;
	const allowedIntensions = ["xlsx"];
	const fileInt = e.target.files[0].name.split(".").pop().toLowerCase();

	if (fileSizeInt > maxSizeInt) {
		valid = false;
		dropZoneInt.classList.add("is-invalid");
		errorFileInt.textContent = `Ukuran file maksimal ${maxSizesMB} MB.`;
		errorFileInt.style.display = "block";
	} else if (!allowedIntensions.includes(fileInt)) {
		valid = false;
		dropZoneInt.classList.add("is-invalid");
		errorFileInt.textContent = "File tidak valid. Intensi file harus Excel. Silahkan download file template dan input data";
		errorFileInt.style.display = "block";
		$("#btnCloseTambahIntBulk").removeClass("d-none");
	} else {
		fileNameDisplayInt.textContent = "📄 " + fileint.name;
		btnCloseUploadMultiInt.style.display = "inline";
		dropZoneInt.classList.remove("is-invalid");
		errorFileInt.textContent = "";
		errorFileInt.style.display = "none";
		readExcelFileInt(fileint);
	}
});

dropZoneInt.addEventListener("dragover", (e) => {
	e.preventDefault();
	dropZoneInt.classList.add("dragover");
});

dropZoneInt.addEventListener("dragleave", (e) => {
	e.preventDefault();
	dropZoneInt.classList.remove("dragover");
});

dropZoneInt.addEventListener("drop", (e) => {
	e.preventDefault();
	dropZoneInt.classList.remove("dragover");

	const files = e.dataTransfer.files;
	if (files.length > 0) {
		fileInputInt.files = files;

		fileNameDisplayInt.textContent = "📄 " + files[0].name;
		btnCloseUploadMultiInt.style.display = "inline";

		readExcelFileInt(files[0]);
	}
});

//event click
$("#drop_zone_template_int").on("click", function () {
	$("#file_upload_template_int").click();
});

$("#btnCloseUploadMultiInt").click(function (e) {
	e.preventDefault();

	fileInputInt.value = "";
	fileNameDisplayInt.textContent = "";
	btnCloseUploadMultiInt.style.display = "none";

	$("#excel_preview_int").html("");
});

$("#btnSimpanIntMulti").click(function () {
	let emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	let emails = {};
	let isInvalid = false;
	let datas = [];

	$("#detail_file_excel_internal tbody tr").each(function () {
		let row = $(this);

			let emailCell = row.find("td:eq(3)");
			let statusCell = row.find("td:eq(8)");

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

			var coluserid = row.find("td:eq(4)").text().trim();
			var coluser = parseInt(coluserid.split(" - ")[0]);

			var colroles = row.find("td:eq(5)").text().trim();
			var rolesid = parseInt(colroles.split(" - ")[0]);

			var colcoladmin = row.find("td:eq(6)").text().trim();
			var coladmin = parseInt(colcoladmin.split(" - ")[0]);

			var colcoladmin = row.find("td:eq(6)").text().trim();
			var coladmin = parseInt(colcoladmin.split(" - ")[0]);

		var colaccessDir = row.find("td:eq(7)").text().trim();

		var accessDirectories = colaccessDir
			.split(".")
			.map(x => parseInt(x.trim()))
			.filter(x => !isNaN(x)); 

 			datas.push({
				name: row.find("td:eq(1)").text().trim(),
				username: row.find("td:eq(2)").text().trim(),
				email: row.find("td:eq(3)").text().trim(),
				collection_user_id: coluser,
				roles_id: rolesid,
				collection_admin: coladmin,
				access_directories: accessDirectories
			});


	});

	if (isInvalid) {
		alert("Mohon perbaiki data terlebih dahulu. Masih ada data tidak valid!");
		return;
	}

	//kirim ajax
	var dataSend = {
		created_by: "",
		user_int_bulky: datas
	};

	console.log(dataSend);

	let resMap = {};
	showLoadingSwal();

	$.ajax({
		url: WebUrl + "/Users/CreateBulk",
		type: "POST",
		contentType: "application/json",
		data: JSON.stringify(dataSend),
		success: function (res) {
			console.log(res);

			res.forEach(item => {
				resMap[item.email] = item;
			});

			$("#detail_file_excel_internal tbody tr").each(function () {
				let row = $(this);
				let emailCell = row.find("td:eq(3)");
				let statusCell = row.find("td:eq(8)");
				let email = emailCell.text().trim();
				if (resMap[email]) {
					let statusText = resMap[email].status_response;
					if (statusText.includes("Failed")) {
						statusCell.html(`<span class="text-danger">${statusText}</span>`);
					} else {
						statusCell.html(`<span class="text-success">${statusText}</span>`);
					}
				}
			});

			$('#table-users-internal').DataTable().ajax.reload();
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
function displayExcelDataInt(excel_fixed_rows, sheetName) {
	$("#excel_preview_int").html("");

	if (!excel_fixed_rows || excel_fixed_rows.length === 0) {
		excelPreviewInt.append(`<p class='text-danger'>Sheet ${sheetName} kosong</p>`);
		return;
	}


	let html = `
		<h5 class="mt-4">${sheetName}</h5>
		<div class="table-responsive mb-4" style="max-height: 200px; overflow-y: auto;">
			<table class="table table-bordered table-sm" id="detail_file_excel_internal">
				<thead>
					<tr>
						<th>No</th>
						<th>Nama Lengkap</th>
						<th>Username</th>
						<th>Email</th>
						<th>Department</th>
						<th>Jabatan</th>
						<th>Apakah Admin</th>
						<th>Akses Department</th>
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
			<td>${row_excel[3] ?? ""}</td>
			<td>${row_excel[4] ?? ""}</td>
			<td>${row_excel[5] ?? ""}</td>
			<td>${row_excel[6] ?? ""}</td>
			<td>${row_excel[7] ?? ""}</td>
			<td class="status-cell"></td>
		</tr>`;
	});

	html += `
				</tbody>
			</table>
		</div>
	`;

	excelPreviewInt.append(html);
}

function readExcelFileInt(fileint) {
	let allowedSheet = ['Detail File Internal'];

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
			const excel_fixed_rows = fixExcelRowsInt(excel_rows);

			displayExcelDataInt(excel_fixed_rows, sheetName);
			//displayExcelDetailDokIndek(excel_fixed_rows, sheetName);
		});

	};

	readerExcel.readAsArrayBuffer(fileint);
}

function isExcelDateInternal(value) {
	return typeof value === "number" && value > 40000 && value < 60000;
}

function excelSerialToDateInternal(serial) {
	const utc_days = Math.floor(serial - 25569);
	const utc_value = utc_days * 86400;
	const date_info = new Date(utc_value * 1000);
	return date_info.toISOString().split("T")[0];
}

function fixExcelRowsInt(rows) {
	return rows.map((row, idx) => {
		if (idx === 0) return row;

		return Array.from(row, col => {
			if (isExcelDateInternal(col)) {
				return excelSerialToDateInternal(col);
			}
			if (col === undefined || col === null) {
				return "";
			}
			return col;
		});
	});
}
