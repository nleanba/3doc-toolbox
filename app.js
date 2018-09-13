import {
    MDCRipple
} from '@material/ripple';
import {
    MDCSelect
} from '@material/select';
import {
    MDCTextField
} from '@material/textfield';
import {
    MDCTopAppBar
} from '@material/top-app-bar/index';
import {
    MDCNotchedOutline
} from '@material/notched-outline';
import {
    MDCSnackbar,
    MDCSnackbarFoundation
} from '@material/snackbar';
import {
    MDCTextFieldIcon
} from '@material/textfield/icon';
import {
    MDCTemporaryDrawer,
    MDCPersistentDrawer,
    MDCPersistentDrawerFoundation,
    util
} from '@material/drawer';

import Dropzone from 'dropzone';
import Server from './lib/server';

const drawer = new MDCTemporaryDrawer(document.getElementById("drawer"));
document.querySelector('.mdc-top-app-bar__navigation-icon').addEventListener('click', () => drawer.open = true);

const textFieldElements = [].slice.call(document.querySelectorAll('.mdc-text-field'));
textFieldElements.forEach((element) => new MDCTextField(element));

const buttonRipple = [].slice.call(document.querySelectorAll('button'));
buttonRipple.forEach((element) => new MDCRipple(element));

const iconButton = [].slice.call(document.querySelectorAll('button'));
const iconButtonRipple = iconButton.forEach((element) => new MDCRipple(element));
//iconButtonRipple.unbounded = true;

const listRipple = [].slice.call(document.querySelectorAll('.list'));
listRipple.forEach((element) => new MDCRipple(element));

const topAppBarElement = [].slice.call(document.querySelectorAll('.mdc-top-app-bar'));
topAppBarElement.forEach((element) => new MDCTopAppBar(element));

// Actual code starts here.

const snackbar = new MDCSnackbar(document.querySelector('.mdc-snackbar'));

const storage = localStorage;

if (storage.getItem("server")) {
    document.getElementById("server-address").value = storage.getItem("server");
    document.getElementById("server-address-label").classList.add("mdc-floating-label--float-above");
} else {
    document.getElementById("server-address").value = "http://localhost:8000";
    document.getElementById("server-address-label").classList.add("mdc-floating-label--float-above");
}

let server = new Server(document.getElementById("server-address").value);

document.querySelector("#save-server-address").addEventListener("click", saveServer);
document.querySelector("#search-documents").addEventListener("click", searchDocuments);
document.querySelector("#search").addEventListener("keypress", e => {
    if (e.key === "Enter") searchDocuments()
});
document.getElementById("set-document-title").addEventListener("click", setDocumentTitle);
document.getElementById("upload").addEventListener("input", inputPostDocument);
document.getElementById("delete").addEventListener("click", deleteDocument);
document.getElementById("create-tag").addEventListener("click", createTag);
document.getElementById("get-tags").addEventListener("click", getTags);
document.getElementById("delete-tag").addEventListener("click", deleteTag);
document.getElementById("add-tag").addEventListener("click", addTag);
document.getElementById("reload-document-tags").addEventListener("click", getDocumentTags);

function getDocumentTags() {
    let id = document.getElementById("document-id").value;
    let dest = document.getElementById("document-tags-here");
    server.getTags(id).then(array => {
        let list = "";
        if (array.error) {
            dest.innerHTML = "";
            snackbar.show({
                message: "Server responded with " + array.statusCode + ": " + array.error,
                timeout: 6000
            });
        } else if (array.length > 0) {
            array.sort(function (a, b) {
                return a.label.localeCompare(b.label);
            })
            array.forEach(a => {
                let type = "Not parameterizable";
                let icon;
                if (a.parameter) {
                    let icon;
                    let value;
                    value = a.parameter.value;
                    if (a.parameter.type == "http://www.w3.org/2001/XMLSchema#decimal") {
                        type = "with number / decimal";
                        icon = "dialpad";
                    } else if (a.parameter.type == "http://www.w3.org/2001/XMLSchema#date") {
                        type = "with date";
                        icon = "event";
                    }
                    list = list + "<div class='mdc-chip'>" +
                        "  <i class='material-icons mdc-chip__icon mdc-chip__icon--leading'>" + icon + "</i>" +
                        "  <div class='mdc-chip'>" +
                        "    <div class='mdc-chip__text'>" +
                        a.label +
                        "    </div>" +
                        "  </div>" +
                        "  <div class='mdc-chip__text'>" +
                        value +
                        "  </div>" +
                        "</div>";
                } else {
                    list = list + "<div class='mdc-chip'>" +
                        "  <i class='material-icons mdc-chip__icon mdc-chip__icon--leading'>label</i>" +
                        "  <div class='mdc-chip__text'>" +
                        a.label +
                        "  </div>" +
                        "</div>";
                }
            });
            dest.innerHTML = list;
            if (list != "") {
                //document.querySelectorAll(".list-document").forEach(element => element.addEventListener("click", fillout));
            }
        } else {
            list = "<li class='mdc-list-item list list-tag mdc-card--outlined'>" +
                "<button class='mdc-list-item__graphic material-icons mdc-button--raised mdc-icon-button important-color' disabled>blur_off</button>" +
                "<span class='mdc-list-item__text'>" +
                "<span class='mdc-list-item__primary-text'>No Tags Found</span>" +
                "<span class='mdc-list-item__secondary-text'>Create some above</span>" +
                "</span>" +
                "</li>";
            dest.innerHTML = list;
        }
    }).catch(e => {
        snackbar.show({
            message: e,
            timeout: 6000
        });
        dest.innerHTML = "";
    });
}

function addTag() {
    let id = document.getElementById("document-id").value;
    let label = document.getElementById("add-tag-label").value;
    let value = document.getElementById("add-tag-value").value;
    if (document.getElementById("radio-11").checked) {
        server.addTag(id,label).then(r => then(r));
    } else if (document.getElementById("radio-12").checked) {
        server.addTag(id,label,"decimal",value).then(then);
    } else if (document.getElementById("radio-13").checked) {
        server.addTag(id,label,"date",value).then(then);
    }

    function then(r) {
        console.log(r);
        if (r.error) {
            snackbar.show({
                message: "Couldn't add Tag: " + r.error
             });
        } else {
            document.getElementById("add-tag-label").value = "";
            document.getElementById("add-tag-label-label").classList.remove("mdc-floating-label--float-above");
            document.getElementById("add-tag-value").value = "";
            document.getElementById("add-tag-value-label").classList.remove("mdc-floating-label--float-above");
            snackbar.show({
                message: "Tag added successfully"
            });
            getTags();
        }
    }
}

function saveServer() {
    let serverAddress = document.querySelector("#server-address").value;
    server = new Server(serverAddress);
    try {
        storage.setItem("server", serverAddress);
    } catch (error) {}
    searchDocuments();
    getTags();
}


function createTag() {
    let label = document.getElementById("tag-label").value;
    if (document.getElementById("radio-1").checked) {
        server.createTag(label).then(r => then(r));
    } else if (document.getElementById("radio-2").checked) {
        server.createTag(label, "decimal").then(then);
    } else if (document.getElementById("radio-3").checked) {
        server.createTag(label, "date").then(then);
    }

    function then(r) {
        console.log(r);
        if (r.error) {
            snackbar.show({
                message: "Couldn't create Tag: " + r.error
             });
        } else {
            document.getElementById("tag-label").value = "";
            document.getElementById("tag-label-label").classList.remove("mdc-floating-label--float-above");
            snackbar.show({
                message: "Tag created successfully"
            });
            getTags();
        }
    }
}

function deleteTag() {
    let label = document.getElementById("tag-label").value;
    server.deleteTag(label).then(r => {
        if (r.error) {
            snackbar.show({
                message: "Couldn't delete Tag: " + r.error
            });
        } else {
            document.getElementById("tag-label").value = "";
            document.getElementById("tag-label-label").classList.remove("mdc-floating-label--float-above");
            snackbar.show({
                message: "Tag deleted successfully"
            });
            getTags();
        }
    });
}

function getTags() {
    let dest = document.getElementById("tag-list-here");
    server.getTags().then(array => {
        let list = "";
        if (array.error) {
            dest.innerHTML = "";
            snackbar.show({
                message: "Server responded with " + array.statusCode + ": " + array.error,
                timeout: 6000
            });
        } else if (array.length > 0) {
            array.sort(function(a,b){
                return a.label.localeCompare(b.label);
            })
            array.forEach(a => {
                let type = "Not parameterizable";
                let icon = "label";
                if (a.parameter) {
                    if (a.parameter.type == "http://www.w3.org/2001/XMLSchema#decimal") {
                        type = "with number / decimal";
                        icon = "dialpad";
                    } else if (a.parameter.type == "http://www.w3.org/2001/XMLSchema#date") {
                        type = "with date";
                        icon = "event";
                    }
                }
                list = list + "<li class='mdc-list-item mdc-card--outlined list list-tag'>" +
                    "  <div class='standard'>" +
                    "    <div class='mdc-chip' tabindex='0'>" +
                    "      <i class='material-icons mdc-chip__icon mdc-chip__icon--leading'>"+ icon +"</i>" +
                    "      <div class='mdc-chip__text'>" +
                    a.label +
                    "      </div>" +
                    //"      <i class='material-icons mdc-chip__icon mdc-chip__icon--trailing'>edit</i>" +
                    "    </div>" +
                    "  </div>" +
                    "</li>";
            });
            dest.innerHTML = list;
            if (list != "") {
                //document.querySelectorAll(".list-document").forEach(element => element.addEventListener("click", fillout));
            }
        } else {
            list = "<li class='mdc-list-item list list-tag mdc-card--outlined'>" +
                "<button class='mdc-list-item__graphic material-icons mdc-button--raised mdc-icon-button important-color' disabled>blur_off</button>" +
                "<span class='mdc-list-item__text'>" +
                "<span class='mdc-list-item__primary-text'>No Tags Found</span>" +
                "<span class='mdc-list-item__secondary-text'>Create some above</span>" +
                "</span>" +
                "</li>";
            dest.innerHTML = list;
        }
    }).catch(e => {
        snackbar.show({
            message: e,
            timeout: 6000
        });
        dest.innerHTML = "";
    });
}

function deleteDocument() {
    let form = document.getElementById("manage-metadata");
    let id = document.getElementById("document-id").value;
    server.deleteDocument(id)
        .then(r => {
            snackbar.show({
                message: "Deleted metadata"
            });
            form.querySelectorAll("input")
                .forEach(element => element.value = "");
            form.querySelectorAll("label")
                .forEach(element => element.classList.remove("mdc-floating-label--float-above"));
            searchDocuments();
        })
}

function postDocument(file) {
    server.uploadFile(file)
        .catch(error => {
            snackbar.show({
                message: error,
                timeout: 6000
            });
        })
        .then(json => {
            server.setDocumentTitle(
                    json.location.substring(json.location.lastIndexOf("/") + 1),
                    file.name.replace(/\.pdf$/,""))
                .then(() => {
                    myDropzone.removeAllFiles();
                    snackbar.show({
                        message: "Document was uploaded succesfully"
                    });
                    searchDocuments()
                });
        });
}

function inputPostDocument() {
    postDocument(document.getElementById("upload").files[0]);
}

function searchDocuments() {
    let query = document.getElementById("search").value;
    let dest = document.getElementById("search-document-list-here");

    server.getDocuments(query).then(array => {
        let list = "";
        if (array.error) {
            dest.innerHTML = "";
            snackbar.show({
                message: "Server responded with " + array.statusCode + ": " + array.error,
                timeout: 6000
            });
        } else if (array.length > 0) {
            array.forEach(a => {
                let label = a.title ? a.title : "Untitled document";
                list = list + "<div class='mdc-card mdc-card--outlined list list-document'>" +
                    "  <div class='list-content'>" +
                    "    <h3 class='mdc-typography--headline5'>" + label + "</h3>" +
                    "    <span class='standard-mono mdc-typography--subtitle1'>" + a.identifier + "</span>" +
                    "  </div>" +
                    "  <div class='mdc-card__actions'>" +
                    "    " +
                    "    <button class='mdc-button mdc-button--unelevated mdc-card__action mdc-card__action--button document-edit'>Edit</button>" +
                    "    <a class='mdc-button mdc-card__action mdc-card__action--button' href='" + server.url + "/doc/" + a.identifier + "' target='_blank'>Open</a>" +
                    "  </div>" +
                    "</div>";
            });
            dest.innerHTML = list;
            if (list != "") {
                document.querySelectorAll(".document-edit").forEach(element => element.addEventListener("click", fillout));
            }
        } else {
            let label1 = query ? " Nothing Found" : " Documents will appear here";
            let label2 = query ? "You can try another query" : "Upload something";
            list = "<div class='mdc-card--outlined list list-document'>" +
                "" +
                "<div class='list-content'>" +
                "<h3 class='mdc-typography--headline5'><span class='material-icons'>blur_off</span>" + label1 + "</h3>" +
                "<span class='mdc-typography--subtitle1'>" + label2 + "</span>" +
                "</div>" +
                "</div>";
            dest.innerHTML = list;
        }
    }).catch(e => {
        snackbar.show({
            message: e,
            timeout: 6000
        });
        dest.innerHTML = "";
    });
}

function setDocumentTitle() {
    let id = document.getElementById("document-id").value;
    let title = document.getElementById("document-title").value;
    server.setDocumentTitle(id, title).then(r => searchDocuments());
}

function fillout() {
    let title = this.parentNode.parentNode.getElementsByClassName("mdc-typography--headline5")[0].innerHTML;
    let id = this.parentNode.parentNode.getElementsByClassName("mdc-typography--subtitle1")[0].innerHTML;
    let idFields = document.querySelectorAll(".document-id");
    idFields.forEach(element => {
        element.value = id;
        element.parentNode.querySelectorAll("label")
            .forEach(element => element.classList.add("mdc-floating-label--float-above"));
    });
    if (title != "Untitled Document") {
        let titleField = document.getElementById("document-title")
        titleField.value = title;
        let parent = titleField.parentNode
        parent.classList.add("mdc-text-field--upgraded");
        parent.querySelectorAll("label")
            .forEach(element => {
                element.classList.add("mdc-floating-label--float-above");
            });
    }
}

searchDocuments();
getTags();

var myDropzone = new Dropzone("div#uploadzone", {
    url: "happy/now",
    autoProcessQueue: false
});

myDropzone.on("addedfile", function (file) {
    postDocument(file);
    return true;
});
