"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const storage_1 = require("./storage");
const dashboardId = 'dashboard';
const trainingId = 'training';
const aboutId = 'about';
const buttonId = 'button';
const containerId = 'container';
let currentPageId = '';
let $paneElement;
let $hiddenElement;
let userData;
function changePage(pageId) {
    if (currentPageId !== pageId) {
        let $currentContainer = $(`#${currentPageId}-${containerId}`);
        let $currentButton = $(`#${currentPageId}-${buttonId}`);
        $currentContainer.css('display', 'none');
        $currentButton.removeClass('active');
        $currentContainer.appendTo($hiddenElement);
        let $newContainer = $(`#${pageId}-${containerId}`);
        let $newButton = $(`#${pageId}-${buttonId}`);
        $newContainer.css('display', 'inline-block');
        $newButton.addClass('active');
        $newContainer.appendTo($paneElement);
        currentPageId = pageId;
    }
}
function startSplash() {
    $('#splash-content').fadeIn(100, function () {
        loadUserData();
    });
}
function loadUserData() {
    let username = process.env.username || process.env.user;
    let storage = new storage_1.Storage(username);
    userData = storage.load();
    if (userData === null) {
        userData = storage.create(5);
    }
    endSplash();
}
function endSplash() {
    $('#splash-content').fadeOut(100, function () {
        changePage(dashboardId);
        let $header = $('#header');
        let $primaryContent = $(`#primary-${containerId}`);
        $(`#splash-${containerId}`).appendTo($hiddenElement);
        $header.prependTo($('.window'));
        $primaryContent.appendTo($('.window-content'));
        $header.css('display', 'inline-block');
        $primaryContent.css('display', 'flex');
    });
}
document.addEventListener('DOMContentLoaded', function () {
    $paneElement = $(`#pane-${containerId}`);
    $hiddenElement = $(`#hidden-${containerId}`);
    // Nav bar buttons
    $(`#${dashboardId}-${buttonId}`).on('click', function () {
        changePage(dashboardId);
    });
    $(`#${trainingId}-${buttonId}`).on('click', function () {
        changePage(trainingId);
    });
    $(`#${aboutId}-${buttonId}`).on('click', function () {
        changePage(aboutId);
    });
    $(`#quit-${buttonId}`).on('click', function () {
        electron_1.ipcRenderer.send('close-main-window');
    });
    // Toolbar buttons
    $(`#minimize-${buttonId}`).on('click', function () {
        electron_1.ipcRenderer.send('minimize-main-window');
    });
    $(`#exit-${buttonId}`).on('click', function () {
        electron_1.ipcRenderer.send('close-main-window');
    });
    // Dashboard page functions
    // Training page functions
    // About page functions
    startSplash();
});
//# sourceMappingURL=renderer.js.map