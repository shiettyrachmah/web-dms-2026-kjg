$('#btnAdd').on('click', function (e) {
    e.preventDefault();
    $('#modalTambah').modal('show');
});

$("#btnCloseModalAdd").click(function (e) {
    e.preventDefault();
    $("#modalTambah").modal("hide");
});

//debugger;
$('#modalTambah').on('shown.bs.modal', function () {

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

$("#btnCloseModalTambah, #btnCancel, .btn-cancel-intMulti").click(function (e) {
    e.preventDefault();
    $("#modalTambah").modal("hide");
});

$('#statusSelect').select2({
    theme: 'bootstrap4',
    dropdownParent: $('#modalTambah'),
    allowClear: true,
    width: '100%'
});

$('#departmentSelect').select2({
    theme: 'bootstrap4',
    dropdownParent: $('#modalTambah'),
    width: '100%',
    placeholder: 'Pilih Department',
    allowClear: true,
    minimumResultsForSearch: 0,
});

$("#modalTambah").on("hidden.bs.modal", function () {
    isEdit = false;
    $("#formTambah")[0].reset();
    $(".form-control").removeClass("is-invalid");
    $("#selectedTags").html("");
    $("#departmentSelect").val(null).trigger("change");
    $("#departmentUserSelect").val(null).trigger("change");

    $('#tabTambahIntBulk').removeClass('show active');

    $('#tabTambahInt').addClass('show active');
    $('#openTabInt').addClass('active');

    $("#excel_preview_int").html("");
    $("#file_upload_template_int").val("");
    $("#file_name_template_int").text("");
    $("#btnCloseTambahIntBulk").removeClass("d-none");
    $("#openTabIntBulk").removeClass("active");
    $("#openTabIntBulk").removeClass("d-none");
    $("#openTabInt").text("Tambah 1 Data");
    $("#modalTambahLabel").text("Tambah Data");
});


document.getElementById('modalTambah').addEventListener('show.bs.modal', function () {
    clearForm();
});

$("#btnSimpan").click(function () {
    let valid = true;

    const inputs = document.querySelectorAll('#formTambah .form-control');
    inputs.forEach(i => i.classList.remove('is-invalid'));

    const name = document.getElementById('name');
    const username = document.getElementById('username');
    const email = document.getElementById('email');
    const password = document.getElementById('password');
    const confirm_password = document.getElementById('confirm_password');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (name.value.trim() === "") {
        valid = false;
        name.classList.add("is-invalid");
    } else {
        name.classList.remove("is-invalid");
    }

    if (username.value.trim() === "") {
        valid = false;
        username.classList.add("is-invalid");
    } else {
        username.classList.remove("is-invalid");
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


    let valDept = $("#selectedTags .badge").map(function () {
        return $(this).data("value");
    }).get();

    const department = document.getElementById('departmentSelect');
    if (!department.value || department.selectedOptions.length === 0) {
        valid = false;
        department.classList.add('is-invalid');
    }

    const departmentUser = document.getElementById('departmentUserSelect');
    if (!departmentUser.value || departmentUser.selectedOptions.length === 0) {
        valid = false;
        departmentUser.classList.add('is-invalid');
    }


    if (isEdit === false) {
        if (password.value.trim() === "") {
            valid = false;
            password.classList.add("is-invalid");
        } else {
            password.classList.remove("is-invalid");
        }

        if (confirm_password.value.trim() === "") {
            valid = false;
            confirm_password.classList.add("is-invalid");
        } else {
            confirm_password.classList.remove("is-invalid");
        }

        if (password.value !== confirm_password.value) {
            valid = false;
            confirm_password.classList.add("is-invalid");
        } else {
            confirm_password.classList.remove("is-invalid");
        }
    } else {
        // edit: jika password diisi → wajib cocok dengan confirm
        if (password.value !== "" || confirm_password.value !== "") {
            if (password.value !== confirm_password.value) {
                valid = false;
                confirm_password.classList.add("is-invalid");
            } else {
                confirm_password.classList.remove("is-invalid");
            }
        }
    }

    const status = document.getElementById('status');
    if (!status.value || status.selectedOptions.length === 0) {
        valid = false;
        status.classList.add('is-invalid');
    }

    const rolesSelected = document.getElementById('roles');
    if (!rolesSelected.value || rolesSelected.selectedOptions.length === 0) {
        valid = false;
        rolesSelected.classList.add('is-invalid');
    }

    if (!valid) return;

    const checkedCollectionAdmin = $("#checkCollectionAdmin").prop("checked") == true ? true : false;

    if (valid) {
        if (isEdit) {
            let data = {
                user_id: $("#user_id").val(),
                name: $("#name").val(),
                email: $("#email").val(),
                username: $("#username").val(),
                status: $("#status").val(),
                roles: $("#roles").val(),
                department: valDept,
                updated_by: "",
                collection_user_id: $("#departmentUserSelect").val(),
                collection_admin: checkedCollectionAdmin
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
                        url: WebUrl + "/Users/Update",
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

                            $("#btnCloseModalTambah").trigger("click");
                            $('#table-users').DataTable().ajax.reload();
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
                name: $("#name").val(),
                email: $("#email").val(),
                username: $("#username").val(),
                password: $("#password").val(),
                status: $("#status").val(),
                roles: $("#roles").val(),
                department: valDept,
                created_by: "",
                collection_user_id: $("#departmentUserSelect").val(),
                collection_admin: checkedCollectionAdmin
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
                        url: WebUrl + "/Users/Create",
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

                            $("#btnCloseModalTambah").trigger("click");
                            $('#table-users').DataTable().ajax.reload();
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

$(document).on('click', '.remove-tag', function () {
    let parentBadge = $(this).closest('.badge');
    let id = parentBadge.data("value");

    let selected = $('#departmentSelect').val();
    selected = selected.filter(val => val != id);
    $('#departmentSelect').val(selected).trigger('change');

    // hapus badge dari tampilan
    parentBadge.remove();
});

$(window).on('resize', function () {
    if (!internalTable) return;

    let newPagingType = getPagingType();
    let oldPagingType = internalTable.settings()[0].oInit.pagingType;

    if (newPagingType !== oldPagingType) {
        internalTable.destroy();
        internalTable = null;
        $('#table-users tbody').empty();
        initDataTableInternal();
    } else {
        internalTable.columns.adjust();
    }
});

$('#departmentSelect').on('change', function () {
    let selected = $(this).val();
    let container = $('#selectedTags');
    container.empty();

    if (selected) {
        selected.forEach(function (val) {
            let text = $('#departmentSelect option[value="' + val + '"]').text();
            let colorClass = "bg-primary";
            container.append(
                `<span class="badge bg-primary me-1 mb-1 text-white mr-1 selected-tag" data-value="${val}">${text}
                                <span class="ms-1 remove-tag" style="cursor:pointer;">&times;</span>
                                </span>`
            );

        });
    }
});

$(document).on("click", ".edit-user", function (e) {
    e.preventDefault();
    isEdit = true;

    let userId = $(this).data("id");

    $("#formTambah")[0].reset();
    $("#selectedTags").html("");
    $("#departmentSelect").val(null).trigger("change");
    $("#departmentUserSelect").val(null).trigger("change");

    $("#modalTambahLabel").text("Edit Data");

    $.ajax({
        url: WebUrl + "/Users/GetById/" + userId,
        type: "GET",
        success: function (res) {
            // console.log(res);

            $("#modalTambah").modal("show");
            $("#user_id").val(userId);
            $("#name").val(res.name);
            $("#username").val(res.username);
            $("#email").val(res.email);
            $("#status").val(res.status).trigger("change");
            $("#departmentUserSelect").val(res.collection_user_id).trigger("change");
            $("#roles").val(res.roles).trigger("change");

            $("#inputpass").hide();

            $("#openTabIntBulk").addClass("d-none");
            $("#openTabInt").text("Edit");

            if (res.department && res.department.length > 0) {
                $("#departmentSelect").val(res.department).trigger("change");
            }

            if (res.collection_admin == true) {
                $("#checkCollectionAdmin").prop("checked", true);
            } else {
                $("#checkCollectionAdmin").prop("checked", false);
            }

        },
        error: function () {
            alert("Gagal mengambil data user");
        }
    });
});

$(document).on("click", ".edit-user-akses", function (e) {
    debugger;
    e.preventDefault();
    isEdit = true;

    let userId = $(this).data("id");

    $("#formTambahUserAkses")[0].reset();

    $("#modalTambahUserAksesLabel").text("Edit Data");

    $.ajax({
        url: WebUrl + "/UsersAdminCollection/GetById/" + userId,
        type: "GET",
        success: function (res) {
             console.log(res);

            $("#modalTambahUserAkses").modal("show");
            $("#user_id_akses").val(res.user_view_auth_dir.user_id);
            $("#name_akses").val(res.user_view_auth_dir.name);
            $("#username_akses").val(res.user_view_auth_dir.username);
            $("#email_akses").val(res.user_view_auth_dir.email);
            $("#status_akses").val(res.user_view_auth_dir.status);
            $("#departmentUser_akses").val(res.user_view_auth_dir.collection_text);
            $("#departmentUserAccess_akses").val(res.user_view_auth_dir.department);
            if (res.user_view_auth_dir.collection_admin == true) {
                $("#checkCollectionAdmin_akses").prop("checked", true);
            } else {
                $("#checkCollectionAdmin_akses").prop("checked", false);
            }
            const treeData = buildTree(res.user_view_access);
            const treeContainer = document.getElementById("tree");
            treeContainer.innerHTML = "";   // ⬅️ PENTING
            treeContainer.appendChild(renderTree(treeData));


        },
        error: function () {
            alert("Gagal mengambil data user");
        }
    });
}); 

$("#collapseAllTree").on("click", function (e) {
    e.preventDefault();
    $(".tooltip").remove();
    let $icon = $(this);

    if ($icon.hasClass("collapsed")) {
        expandAllTree();
        $icon.removeClass("collapsed")
            .removeClass("fa-caret-up")
            .addClass("fa-caret-down");
    } else {
        collapseAllTree();
        $icon.addClass("collapsed")
            .removeClass("fa-caret-down")
            .addClass("fa-caret-up");
    }
});

$('#tree').on('change', '.tree-check', function (e) {
    e.stopPropagation();

    const $checkbox = $(this);
    const isChecked = this.checked;
    const level = parseInt($checkbox.data('level'));
    const $li = $checkbox.closest('li');

    if (level === 1) {
        $li.find('ul .tree-check').prop('checked', isChecked);
    }

    if (level > 0 && !isChecked) {
        const $parentLi = $li.parents('li').filter(function () {
            return parseInt($(this).children('.tree-check').data('level')) === 1;
        }).first();

        $parentLi.children('.tree-check').prop('checked', false);
    }
});



$("#btnCloseModalTambahUserAkses").click(function (e) {
    e.preventDefault();
    $("#list_user_permission").addClass("d-none");
    $("#modalTambahUserAkses").modal("hide");
});

$('#modalTambahUserAkses').modal({
    backdrop: 'static',
    keyboard: false,
    show: false
});

$("#btnCloseModalTambahUserAkses, #btnCancelUserAkses").click(function (e) {
    e.preventDefault();
    $("#list_user_permission").addClass("d-none");
    $("#modalTambahUserAkses").modal("hide");
});


$("#modalTambahUserAkses").on("hidden.bs.modal", function () {
    isEdit = false;
    $("#formTambahUserAkses")[0].reset();
    $(".form-control").removeClass("is-invalid");
});


document.getElementById('modalTambahUserAkses').addEventListener('show.bs.modal', function () {
    clearFormUserAkses();
});

$("#modalTambahUserAkses").on("hidden.bs.modal", function () {
    isEdit = false;
    $("#formTambahUserAkses")[0].reset();
    $(".form-control").removeClass("is-invalid");
});

$("#btnSimpanUserAkses").click(function () {
    let valid = true;
    const checkedData = getCheckedTreeData();
    if (checkedData.length === 0) {
        valid = false;
        $("#list_user_permission").removeClass("d-none");
    } else {
        $("#list_user_permission").addClass("d-none");
    }

    if (!valid) return;

    //console.log(checkedData);

    var user_vm = {
        user_id: $("#user_id_akses").val(),
        updated_by: ""
    };

    var access_list = [];
    access_list = checkedData;

    var dataSend = {
        user_vm: user_vm,
        list_user_detail_permission: access_list
    }

    if (!valid) return;
    $.ajax({
        url: WebUrl + "/UsersAdminCollection/UpdateAccessUser",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify(dataSend),
        success: function (res) {
            $("#btnCloseModalTambah").trigger("click");
            $('#table-users').DataTable().ajax.reload();

            Swal.fire({
                icon: "success",
                title: "Berhasil",
                text: "Berhasil Disimpan",
                timer: 1500,
                showConfirmButton: false
            });

        },
        error: function (xhr) {
            //console.log(xhr);
            Swal.fire({
                icon: "error",
                title: "Gagal!",
                text: "Terjadi kesalahan saat menyimpan perubahan."
            });
        }
    });


});

function clearFormUserAkses() {
    const inputs = document.querySelectorAll('#formTambahUserAkses .form-control');
    inputs.forEach(i => i.value = '');

    inputs.forEach(i => i.classList.remove('is-invalid'));
}
function getPagingType() {
    return window.innerWidth <= 768 ? 'simple' : 'full_numbers';
}

debugger;

function initDataTableInternal() {
    if (internalTable) return;

    internalTable = $('#table-users').DataTable({
        dom: "<'row'<'col-md-6'l><'col-md-6'f>>" +
            "<'row mt-3'<'col-md-6'B>>" +
            "<'row'<'col-sm-12'tr>>" +
            "<'row'<'col-sm-12 col-md-5'i><'col-sm-12 col-md-7'p>>",
        buttons: [
            {
                extend: 'csvHtml5',
                text: 'CSV',
                title: 'Pengguna Internal',
                className: 'btn btn-sm btn-lightblue shadow-sm',
            },
            {
                extend: 'csvHtml5',
                text: 'CSV',
                title: 'Pengguna Internal', className: 'btn btn-sm btn-lightblue shadow-sm',
                action: function (e, dt, button, config) {
                    let visibleColumns = dt.columns(':visible').indexes().toArray();
                    if (getPagingType() === "simple") {
                        visibleColumns = dt.columns().indexes().toArray();
                    }

                    $.ajax({
                        url: WebUrl + "/Users/GetDataPaging",
                        type: "GET",
                        data: {
                            draw: 1,
                            start: 0,
                            length: -1,
                            searchValue: $('#table-users_filter input').val() || "null",
                            sortColumn: dt.order()[0] ? dt.settings().init().columns[dt.order()[0][0]].data : "",
                            sortDirection: dt.order()[0] ? dt.order()[0][1] : "asc",
                            getAllData: true
                        },
                        success: function (response) {
                            let csvContent = "data:text/csv;charset=utf-8,";
                            let headers = ["No", "Nama Pengguna", "email", "Username", "Tanggal", "Status"];

                            csvContent += headers.filter((_, index) => visibleColumns.includes(index)).join(",") + "\n";

                            response.data.forEach((item, index) => {
                                let row = [
                                    index + 1,
                                    item.name,
                                    item.email,
                                    item.username,
                                    item.created_at_text,
                                    item.status_text
                                ];
                                csvContent += row.filter((_, idx) => visibleColumns.includes(idx)).join(",") + "\n";
                            });

                            let encodedUri = encodeURI(csvContent);
                            let link = document.createElement("a");
                            link.setAttribute("href", encodedUri);
                            link.setAttribute("download", "Pengguna Internal.csv");
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
                title: 'Pengguna Internal', className: 'btn btn-sm btn-lightblue shadow-sm',
                action: function (e, dt, button, config) {
                    let visibleColumns = dt.columns(':visible').indexes().toArray();
                    if (getPagingType() === "simple") {
                        visibleColumns = dt.columns().indexes().toArray();
                    }

                    $.ajax({
                        url: WebUrl + "/Users/GetDataPaging",
                        type: "GET",
                        data: {
                            draw: 1,
                            start: 0,
                            length: -1,
                            searchValue: $('#table-users_filter input').val() || "null",
                            sortColumn: dt.order()[0] ? dt.settings().init().columns[dt.order()[0][0]].data : "",
                            sortDirection: dt.order()[0] ? dt.order()[0][1] : "asc",
                            getAllData: true
                        },
                        success: function (response) {
                            let formatted = response.data.map((item, index) => ({
                                "#": index + 1,
                                "Nama Pengguna": item.name,
                                "email": item.email,
                                "username": item.username,
                                "Tanggal": item.created_at_text,
                                "Department": item.collection_text,
                                "Admin": item.collection_admin == true ? "Ya" : "Tidak",
                                "Akses Department": item.access_department
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
                            XLSX.writeFile(wb, "Pengguna Internal.xlsx");
                        }
                    });
                }
            },
            {
                extend: 'pdfHtml5',
                text: 'PDF',
                title: 'Pengguna Internal', className: 'btn btn-sm btn-lightblue shadow-sm',
                action: function (e, dt, button, config) {
                    let visibleColumns = dt.columns(':visible').indexes().toArray();
                    if (getPagingType() === "simple") {
                        visibleColumns = dt.columns().indexes().toArray();
                    }

                    $.ajax({
                        url: WebUrl + "/Users/GetDataPaging",
                        type: "GET",
                        data: {
                            draw: 1,
                            start: 0,
                            length: -1,
                            searchValue: $('#table-users_filter input').val() || "null",
                            sortColumn: dt.order()[0] ? dt.settings().init().columns[dt.order()[0][0]].data : "",
                            sortDirection: dt.order()[0] ? dt.order()[0][1] : "asc",
                            getAllData: true
                        },
                        success: function (response) {
                            let doc = new window.jspdf.jsPDF('l', 'mm', 'a4');
                            let pageWidth = doc.internal.pageSize.getWidth();
                            let title = "Pengguna Internal";
                            let titleWidth = doc.getTextWidth(title);
                            let centerX = (pageWidth - titleWidth) / 2;

                            doc.setFontSize(12);
                            doc.text(title, centerX, 16);

                            let data = response.data.map((item, index) => [
                                index + 1,
                                item.name,
                                item.email,
                                item.username,
                                item.created_at_text,
                                item.collection_text,
                                item.collection_admin == true ? "Ya" : "Tidak",
                                item.access_department
                            ]);

                            let headers = [
                                ["#", "Nama Pengguna", "email", "Username", "Tanggal", "Department", "Admin", "Akses Department"]
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
                                    2: { cellWidth: '15%' },
                                    3: { cellWidth: '15%' },
                                    4: { cellWidth: '15%' },
                                    5: { cellWidth: '15%' },
                                    6: { cellWidth: '10%' },
                                    7: { cellWidth: '10%' }
                                }
                            });

                            doc.save("Pengguna Internal.pdf");
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
            "url": WebUrl + "/Users/GetDataPaging",
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
                if ($.fn.DataTable.isDataTable('#table-users')) {
                    let dt = $('#table-users').DataTable();
                    dt.destroy();
                    $('#table-users tbody').empty();
                }
                $('#table-users_processing').hide();
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
            { data: "username" },
            { data: "created_at_text" },
            // { data: "i_class_status" },
            { data: "collection_text" },
            { data: "role_name" },
            { data: "i_class_collectionadmin", className: "text-center" },
            { data: "access_department" },
            {
                data: "user_id",
                orderable: false,
                searchable: false,
                className: "text-center",
                render: function (data, type, row, meta) {
                    
                    let buttonEditUser = "";

                    let buttonEditAkses = `<a href="#" class="edit-user-akses" data-id="${data}" data-toggle="tooltip" data-placement="top" title="Edit Akses"><i class="fas fa-user-shield"></i></a>`

                    if (TabEdit === "True") {
                        buttonEditUser = `<a href="#" class="edit-user" data-id="${data}" data-toggle="tooltip" data-placement="top" title="Edit Data"><i class="fas fa-edit"></i></a>`;
                    }
                    return `${ buttonEditUser } ${ buttonEditAkses }`;
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
        pagingType: getPagingType(),
    }).buttons().container().appendTo('#example-pengguna_wrapper .col-md-6:eq(0)');
}


function clearForm() {
    const inputs = document.querySelectorAll('#formTambah .form-control');
    inputs.forEach(i => i.value = '');

    inputs.forEach(i => i.classList.remove('is-invalid'));
    document.getElementById("selectedTags").innerHTML = "";
    $("#roles").trigger("change");
    $("#departmentUserSelect").trigger("change");
}

function updateParentCheckbox($li) {
    const $parentLi = $li.parents('li').first();
    if ($parentLi.length === 0) return;

    const $parentCheckbox = $parentLi.children('.tree-check');
    const $siblings = $parentLi.find('> ul > li > .tree-check');

    const checkedCount = $siblings.filter(':checked').length;

    if (checkedCount === 0) {
        $parentCheckbox.prop({
            checked: false,
            indeterminate: false
        });
    } else if (checkedCount === $siblings.length) {
        $parentCheckbox.prop({
            checked: true,
            indeterminate: false
        });
    } else {
        $parentCheckbox.prop({
            checked: false,
            indeterminate: true
        });
    }

    updateParentCheckbox($parentLi);
}

function collapseAllTree() {
    $('#tree ul').addClass('d-none');
    $('#tree .toggle').text('▶');

    $('#tree i.fa-folder-open')
        .removeClass('fa-folder-open text-warning')
        .addClass('fa-folder text-warning');

    $('#tree > ul').removeClass('d-none');
}

function expandAllTree() {
    $('#tree ul').removeClass('d-none');
    $('#tree .toggle').text('▼');

    $('#tree i.fa-folder')
        .removeClass('fa-folder text-warning')
        .addClass('fa-folder-open text-warning');
}

function getCheckedTreeData() {
    const result = [];

    $('#tree .tree-check:checked').each(function () {
        const $cb = $(this);

        result.push({
            parent_id: $cb.data('parentid'),
            name: String($cb.data('name')),
            level: $cb.data('level'),
            indek: parseInt($cb.data('indek')),
            path: String($cb.data('path')),
            directories_id: String($cb.data('dirid')),
            collection_id: String($cb.data('colid')),
            user_id: String($cb.data('userid')),
        });
    });

    return result;
}

function buildTree(rows) {
    const map = {};
    const roots = [];

    // buat map id → node
    rows.forEach(row => {
        map[row.id] = {
            ...row,
            children: []
        };
    });

    // susun parent-child
    rows.forEach(row => {
        if (row.parent_id && map[row.parent_id]) {
            map[row.parent_id].children.push(map[row.id]);
        } else {
            // parent_id = 0 → ROOT (level 0)
            roots.push(map[row.id]);
        }
    });

    return roots;
}

function renderTree(nodes, isRoot = true) {
    const ul = document.createElement("ul");
    ul.className = isRoot
        ? "list-unstyled"
        : "list-unstyled ml-4";

    nodes.forEach(node => {
        const li = document.createElement("li");
        li.classList.add("mb-1");

        const hasChildren = node.children.length > 0;
        const is_permission = `${node.is_detail_user_permission}`;

        if (hasChildren) {
            const childrenId = "children-" + node.id;

            li.innerHTML = `
                                    <span class="toggle" data-target="${childrenId}">▶</span>

                                        ${node.level >= 0 ? `
                                        <input type="checkbox"
                                            class="tree-check mr-1"
                                            data-parentid="${node.parent_id ?? ''}"
                                            data-name="${node.name ?? ''}"
                                            data-level="${node.level ?? ''}"
                                            data-indek="${node.indek ?? ''}"
                                            data-path="${node.path ?? ''}"
                                            data-dirid="${node.directories_id ?? ''}"
                                            data-colid="${node.collection_id ?? ''}"
                                            data-rootid="${node.root_id ?? ''}"
                                            data-userid="${node.user_id ?? ''}"
                                            ${node.is_detail_user_permission === true ? 'checked' : ''}
                                        />
                                    ` : ''}

                                    <i class="fas fa-folder text-warning mr-1"></i>

                                    <span class="tree-node"
                                        data-parentid="${node.parent_id}"
                                        data-name="${node.name}"
                                        data-level="${node.level}"
                                        data-indek="${node.indek}"
                                        data-path="${node.path}"
                                        data-dirid="${node.directories_id}"
                                        data-rootid="${node.root_id}"
                                        data-colid="${node.collection_id}"
                                        data-userid="${node.user_id}"
                                        >
                                        ${node.name}
                                    </span>
                                `;

            const childUl = renderTree(node.children, false);
            childUl.id = childrenId;
            childUl.classList.add("d-none");
            li.appendChild(childUl);

        } else {
            li.innerHTML = `
                                    <span class="ml-3"></span>

                                    ${node.level >= 0 ? `
                                        <input type="checkbox"
                                            class="tree-check mr-1"
                                            data-parentid="${node.parent_id ?? ''}"
                                            data-name="${node.name ?? ''}"
                                            data-level="${node.level ?? ''}"
                                            data-indek="${node.indek ?? ''}"
                                            data-path="${node.path ?? ''}"
                                            data-dirid="${node.directories_id ?? ''}"
                                            data-colid="${node.collection_id ?? ''}"
                                            data-rootid="${node.root_id ?? ''}"
                                            data-userid="${node.user_id ?? ''}"
                                            ${node.is_detail_user_permission === true ? 'checked' : ''}
                                        />
                                    ` : ''}

                                    <i class="fas fa-folder text-warning mr-1"></i>

                                    <span class="tree-node"
                                            data-parentid="${node.parent_id}"
                                            data-name="${node.name}"
                                            data-level="${node.level}"
                                            data-indek="${node.indek}"
                                            data-path="${node.path}"
                                            data-dirid="${node.directories_id}"
                                            data-rootid="${node.root_id}"
                                            data-colid="${node.collection_id}"
                                            data-userid="${node.user_id}"
                                        >
                                        ${node.name}
                                    </span>
                                `;
        }


        ul.appendChild(li);
    });

    return ul;
}

function toggleNode(childrenId, toggleElement) {
    const childUl = document.getElementById(childrenId);
    const iconFolder = toggleElement.nextElementSibling;

    if (childUl.classList.contains("d-none")) {
        // OPEN
        childUl.classList.remove("d-none");
        toggleElement.textContent = "▼";

        iconFolder.classList.remove("fa-folder", "text-warning");
        iconFolder.classList.add("fa-folder-open", "text-warning");

    } else {
        // CLOSE
        childUl.classList.add("d-none");
        toggleElement.textContent = "▶";

        iconFolder.classList.remove("fa-folder-open", "text-warning");
        iconFolder.classList.add("fa-folder", "text-warning");
    }
}

function updateArrow(ul, symbol) {
    const parent = ul.parentElement;
    if (parent) {
        const toggle = parent.querySelector(".toggle");
        if (toggle) toggle.textContent = symbol;
    }
}
