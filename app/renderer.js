"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const dashboardId = 'dashboard';
const trainingId = 'training';
const aboutId = 'about';
const buttonId = 'button';
const mainId = 'main';
let currentPageId = '';
let $paneElement;
let $hiddenElement;
function changePage(pageId) {
    if (currentPageId !== pageId) {
        let $currentPageElement = $(`#${currentPageId}-${mainId}`);
        let $currentPageButton = $(`#${currentPageId}-${buttonId}`);
        $currentPageElement.css('display', 'none');
        $currentPageButton.removeClass('active');
        $currentPageElement.appendTo($hiddenElement);
        let $newPageElement = $(`#${pageId}-${mainId}`);
        let $newPageButton = $(`#${pageId}-${buttonId}`);
        $newPageElement.css('display', 'inline-block');
        $newPageButton.addClass('active');
        $newPageElement.appendTo($paneElement);
        currentPageId = pageId;
    }
}
document.addEventListener('DOMContentLoaded', function () {
    $paneElement = $(`#pane-${mainId}`);
    $hiddenElement = $(`#hidden-${mainId}`);
    // Quit function
    $(`#quit-${buttonId}`).on('click', function () {
        electron_1.ipcRenderer.send('close-main-window');
    });
    // Page changing
    $(`#${dashboardId}-${buttonId}`).on('click', function () {
        changePage(dashboardId);
    });
    $(`#${trainingId}-${buttonId}`).on('click', function () {
        changePage(trainingId);
    });
    $(`#${aboutId}-${buttonId}`).on('click', function () {
        changePage(aboutId);
    });
    // Dashboard page functions
    // Training page functions
    // About page functions
    changePage(dashboardId);
});
//# sourceMappingURL=renderer.js.map