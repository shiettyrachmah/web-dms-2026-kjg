//debugger;
$('#btnAddExt').on('click', function (e) {
    e.preventDefault();
    $('#modalTambahExternal').modal('show');
});

$("#btnCloseModalExtTambah").click(function (e) {
    e.preventDefault();
    $("#modalTambahExternal").modal("hide");
});

$('#modalTambahExternal').on('shown.bs.modal', function () {
    var $modal = $(this);

    $.fn.modal.Constructor.prototype._enforceFocus = function () { };

    $modal.find('select.select2').each(function () {
        var $sel = $(this);

        if ($sel.hasClass('select2-hidden-accessible')) {
            $sel.select2('destroy');
        }

        $sel.select2({
            theme: 'bootstrap4',
            dropdownParent: $modal,
            width: '100%',
            minimumResultsForSearch: 0
        });
    });
});

$("#btnCloseModalExtTambah, #btnCancelExt, #btnCancelExtMulti").click(function (e) {
    e.preventDefault();
    $("#modalTambahExternal").modal("hide");
});

$('#statusSelect').select2({
    theme: 'bootstrap4',
    dropdownParent: $('#modalTambahExternal'),
    allowClear: true,
    width: '100%'
});

$("#btnSimpanExt").click(function () {
    let valid = true;

    const inputs = document.querySelectorAll('#formTambahExt .form-control');
    inputs.forEach(i => i.classList.remove('is-invalid'));

    const name = document.getElementById('name_ext');
    const email = document.getElementById('email_ext');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (name.value.trim() === "") {
        valid = false;
        name.classList.add("is-invalid");
    } else {
        name.classList.remove("is-invalid");
    }

    if (email.value.trim() === "") {
        valid = false;
        email.classList.add("is-invalid");
    } else if (!emailRegex.test(email.value)) {
        valid = false;
        email.classList.add("is-invalid");
        email.nextElementSibling.innerText = "Format email tidak valid (contoh: emailname@gmail.com)";
    } else {
        email.classList.remove("is-invalid");
    }

    const status = document.getElementById('status_ext');
    if (!status.value || status.selectedOptions.length === 0) {
        valid = false;
        status.classList.add('is-invalid');
    }
    if (!valid) return;

    if (valid) {
        if (isEdit) {
            let data = {
                user_ext_id: $("#user_ext_id").val(),
                name: $("#name_ext").val(),
                email: $("#email_ext").val(),
                status: $("#status_ext").val(),
                updated_by: "",
            };

            Swal.fire({
                title: "Perubahan Data",
                text: "Apakah Anda yakin ingin menyimpan perubahan data ini?",
                icon: "warning",
                showCancelButton: true,
                confirmButtonColor: "#3085d6",
                cancelButtonColor: "#d33",
                confirmButtonText: "Ya",
                cancelButtonText: "Batal"
            }).then((result) => {
                if (result.isConfirmed) {
                    $.ajax({
                        url: WebUrl + "/UsersExternal/Update",
                        type: "POST",
                        contentType: "application/json",
                        data: JSON.stringify(data),
                        success: function (res) {
                            Swal.fire({
                                icon: "success",
                                title: "Berhasil!",
                                text: "Berhasil Disimpan.",
                                timer: 1500,
                                showConfirmButton: false
                            });

                            $("#btnCloseModalExtTambah").trigger("click");
                            $('#table-users-external').DataTable().ajax.reload();
                        },
                        error: function () {
                            Swal.fire({
                                icon: "error",
                                title: "Gagal!",
                                text: "Terjadi Kesalahan dalam menyimpan."
                            });
                        }
                    });
                }
            });
        } else {
            let data = {
                name: $("#name_ext").val(),
                email: $("#email_ext").val(),
                status: $("#status_ext").val(),
                created_by: ""               
            };

            Swal.fire({
                title: "Simpan Data",
                text: "Apakah Anda yakin ingin menyimpan data ini?",
                icon: "warning",
                showCancelButton: true,
                confirmButtonColor: "#3085d6",
                cancelButtonColor: "#d33",
                confirmButtonText: "Ya",
                cancelButtonText: "Batal"
            }).then((result) => {
                if (result.isConfirmed) {
                    $.ajax({
                        url: WebUrl + "/UsersExternal/Create",
                        type: "POST",
                        contentType: "application/json",
                        data: JSON.stringify(data),
                        success: function (res) {
                            Swal.fire({
                                icon: "success",
                                title: "Berhasil!",
                                text: "Berhasil Disimpan.",
                                timer: 1500,
                                showConfirmButton: false
                            });

                            $("#btnCloseModalExtTambah").trigger("click");
                            $('#table-users-external').DataTable().ajax.reload();
                        },
                        error: function () {
                            Swal.fire({
                                icon: "error",
                                title: "Gagal!",
                                text: "Terjadi Kesalahan dalam menyimpan."
                            });
                        }
                    });
                }
            });
        }

    }
});

$("#modalTambahExternal").on("hidden.bs.modal", function () {
    isEdit = false;
    $("#formTambahExt")[0].reset();
    $(".form-control").removeClass("is-invalid");
    $("#openTabExtBulk").removeClass("active");
    $('#tabTambahExtBulk').removeClass('show active');

    $('#tabTambahExt').addClass('show active');
    $('#openTabExt').addClass('active');
    $("#excel_preview").html("");
    $("#file_upload_template_ext").val("");
    $("#file_name_template_ext").text("");

    $("#openTabExtBulk").removeClass("d-none");
    $("#openTabExt").text("Tambah 1 Data");
    $("#modalTambahLabel").text("Tambah Data");
});

document.getElementById('modalTambahExternal').addEventListener('show.bs.modal', function () {
    clearFormExt();
});

$(window).on('resize', function () {
    if (!externalTable) return;

    let newPagingType = getPagingTypeExt();
    let oldPagingType = externalTable.settings()[0].oInit.pagingType;

    if (newPagingType !== oldPagingType) {
        externalTable.destroy();
        externalTable = null;
        $('#table-users-external tbody').empty();
        initDataTableExternal();
    } else {
        externalTable.columns.adjust();
    }
});

$(document).on("click", ".edit-user-external", function (e) {
    e.preventDefault();
    isEdit = true;

    let userId = $(this).data("id");

    $("#formTambahExt")[0].reset();

    $("#modalTambahExtLabel").text("Edit Data");

    $.ajax({
        url: WebUrl + "/UsersExternal/GetById/" + userId,
        type: "GET",
        success: function (res) {
            $("#modalTambahExternal").modal("show");
            $("#user_ext_id").val(userId);
            $("#name_ext").val(res.name);
            $("#email_ext").val(res.email);
            $("#status_ext").val(res.status).trigger("change");

            $("#openTabExtBulk").addClass("d-none");
            $("#openTabExt").text("Edit");
            $("#modalTambahLabel").text("Edit Data");
        },
        error: function () {
            alert("Gagal mengambil data user");
        }
    });
});

function getPagingTypeExt() {
    return window.innerWidth <= 768 ? 'simple' : 'full_numbers';
}

function initDataTableExternal() {
    if (externalTable) return;

    externalTable = $('#table-users-external').DataTable({
        dom: "<'row'<'col-md-6'l><'col-md-6'f>>" +
            "<'row mt-3'<'col-md-6'B>>" +
            "<'row'<'col-sm-12'tr>>" +
            "<'row'<'col-sm-12 col-md-5'i><'col-sm-12 col-md-7'p>>",
        buttons: [
            {
                extend: 'csvHtml5',
                text: 'CSV',
                title: 'Pengguna External',
                className: 'btn btn-sm btn-lightblue shadow-sm',
            },
            {
                extend: 'csvHtml5',
                text: 'CSV',
                title: 'Pengguna External', className: 'btn btn-sm btn-lightblue shadow-sm',
                action: function (e, dt, button, config) {
                    let visibleColumns = dt.columns(':visible').indexes().toArray();
                    if (getPagingTypeExt() === "simple") {
                        visibleColumns = dt.columns().indexes().toArray();
                    }

                    $.ajax({
                        url: WebUrl + "/UsersExternal/GetDataPaging",
                        type: "GET",
                        data: {
                            draw: 1,
                            start: 0,
                            length: -1,
                            searchValue: $('#table-documenttypes_filter input').val() || "null",
                            sortColumn: dt.order()[0] ? dt.settings().init().columns[dt.order()[0][0]].data : "",
                            sortDirection: dt.order()[0] ? dt.order()[0][1] : "asc",
                            getAllData: true
                        },
                        success: function (response) {
                            let csvContent = "data:text/csv;charset=utf-8,";
                            let headers = ["No", "Nama Pengguna", "email", "Tanggal", "Status"];

                            csvContent += headers.filter((_, index) => visibleColumns.includes(index)).join(",") + "\n";

                            response.data.forEach((item, index) => {
                                let row = [
                                    index + 1,
                                    item.name,
                                    item.email,
                                    item.created_at_text,
                                    item.status_text
                                ];
                                csvContent += row.filter((_, idx) => visibleColumns.includes(idx)).join(",") + "\n";
                            });

                            let encodedUri = encodeURI(csvContent);
                            let link = document.createElement("a");
                            link.setAttribute("href", encodedUri);
                            link.setAttribute("download", "Pengguna External.csv");
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                        }
                    });
                }
            },
            {
                extend: 'excelHtml5',
                text: 'Excel',
                title: 'Pengguna External', className: 'btn btn-sm btn-lightblue shadow-sm',
                action: function (e, dt, button, config) {
                    let visibleColumns = dt.columns(':visible').indexes().toArray();
                    if (getPagingTypeExt() === "simple") {
                        visibleColumns = dt.columns().indexes().toArray();
                    }

                    $.ajax({
                        url: WebUrl + "/UsersExternal/GetDataPaging",
                        type: "GET",
                        data: {
                            draw: 1,
                            start: 0,
                            length: -1,
                            searchValue: $('#table-documenttypes_filter input').val() || "null",
                            sortColumn: dt.order()[0] ? dt.settings().init().columns[dt.order()[0][0]].data : "",
                            sortDirection: dt.order()[0] ? dt.order()[0][1] : "asc",
                            getAllData: true
                        },
                        success: function (response) {
                            let formatted = response.data.map((item, index) => ({
                                "#": index + 1,
                                "Nama Pengguna": item.name,
                                "email": item.email,
                                "Tanggal": item.created_at_text,    
                                "Status": item.status_text
                            }));

                            let columns = Object.keys(formatted[0]);
                            let filteredData = formatted.map(row => {
                                let newRow = {};
                                columns.forEach((col, idx) => {
                                    if (visibleColumns.includes(idx)) {
                                        newRow[col] = row[col];
                                    }
                                });
                                return newRow;
                            });

                            let wb = XLSX.utils.book_new();
                            let ws = XLSX.utils.json_to_sheet(filteredData);
                            XLSX.utils.book_append_sheet(wb, ws, "Data");
                            XLSX.writeFile(wb, "Pengguna External.xlsx");
                        }
                    });
                }
            },
            {
                extend: 'pdfHtml5',
                text: 'PDF',
                title: 'Pengguna External', className: 'btn btn-sm btn-lightblue shadow-sm',
                action: function (e, dt, button, config) {
                    let visibleColumns = dt.columns(':visible').indexes().toArray();
                    if (getPagingTypeExt() === "simple") {
                        visibleColumns = dt.columns().indexes().toArray();
                    }

                    $.ajax({
                        url: WebUrl + "/UsersExternal/GetDataPaging",
                        type: "GET",
                        data: {
                            draw: 1,
                            start: 0,
                            length: -1,
                            searchValue: $('#table-documenttypes_filter input').val() || "null",
                            sortColumn: dt.order()[0] ? dt.settings().init().columns[dt.order()[0][0]].data : "",
                            sortDirection: dt.order()[0] ? dt.order()[0][1] : "asc",
                            getAllData: true
                        },
                        success: function (response) {
                            let doc = new window.jspdf.jsPDF('l', 'mm', 'a4');
                            let pageWidth = doc.external.pageSize.getWidth();
                            let title = "Pengguna External";
                            let titleWidth = doc.getTextWidth(title);
                            let centerX = (pageWidth - titleWidth) / 2;

                            doc.setFontSize(12);
                            doc.text(title, centerX, 16);

                            let data = response.data.map((item, index) => [
                                index + 1,
                                item.name,
                                item.email,
                                item.created_at_text,
                                item.status_text
                            ]);

                            let headers = [
                                ["#", "Nama Pengguna", "email","Tanggal", "Status"]
                            ];

                            let filteredHeaders = headers[0].filter((_, idx) => visibleColumns.includes(idx));
                            let filteredData = data.map(row => row.filter((_, idx) => visibleColumns.includes(idx)));

                            doc.autoTable({
                                head: [filteredHeaders],
                                body: filteredData,
                                startY: 25,
                                styles: { fontSize: 9, cellPadding: 1.5, overflow: 'linebreak' },
                                headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
                                alternateRowStyles: { fillColor: [240, 240, 240] },
                                columnStyles: {
                                    0: { cellWidth: '5%' },
                                    1: { cellWidth: '20%' },
                                    2: { cellWidth: '20%' },
                                    3: { cellWidth: '20%' },
                                    4: { cellWidth: '10%' }
                                }
                            });

                            doc.save("Pengguna External.pdf");
                        }
                    });
                }
            },
            {
                extend: 'print',
                text: 'Print',
                title: 'Pengguna', className: 'btn btn-sm btn-lightblue shadow-sm',
            }
        ],
        processing: true,
        serverSide: true,
        ajax: {
            "url": WebUrl + "/UsersExternal/GetDataPaging",
            "type": "GET",
            "data": function (d) {
                d.draw = d.draw;
                d.start = d.start;
                d.length = d.length;
                d.searchValue = d.search.value ? d.search.value : "null";
                d.sortColumn = d.columns[d.order[0].column].data;
                d.sortDirection = d.order[0].dir;
                d.getAllData = false;
            },
            "dataSrc": function (json) {
                return json.data;
            },
            error: function () {
                if ($.fn.DataTable.isDataTable('#table-users-external')) {
                    let dt = $('#table-users-external').DataTable();
                    dt.destroy();
                    $('#table-users-external tbody').empty();
                }
                $('#table-documenttypes_processing').hide();
            }
        },
        columns: [
            {
                data: null,
                orderable: false,
                searchable: false,
                render: function (data, type, row, meta) {
                    var page = meta.settings._iDisplayStart / meta.settings._iDisplayLength;
                    var rowNumber = (page * meta.settings._iDisplayLength) + meta.row + 1;
                    return rowNumber;
                }
            },
            { data: "name" },
            { data: "email" },
            { data: "created_at_text" },           
            {
                data: "user_ext_id",
                orderable: false,
                searchable: false,
                className: "text-center",
                render: function (data) {
                    return `<a href="#" class="edit-user-external" data-id="${data}"><i class="fas fa-edit"></i></a>`;
                }
            },
        ],
        pageLength: lengthDefault,
        lengthChange: true,
        autoWidth: false,
        responsive: true,
        scrollCollapse: true,
        fixedHeader: true,
        scrollY: "530px",
        pagingType: getPagingTypeExt(),
    }).buttons().container().appendTo('#example-pengguna_wrapper .col-md-6:eq(0)');
}

function clearFormExt() {
    const inputs = document.querySelectorAll('#formTambahExt .form-control');
    inputs.forEach(i => i.value = '');
    inputs.forEach(i => i.classList.remove('is-invalid'));
}