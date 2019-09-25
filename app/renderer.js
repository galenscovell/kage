"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const dashboardId = 'dashboard';
const trainingId = 'training';
const aboutId = 'about';
const buttonId = 'button';
const containerId = 'container';
let currentPageId = '';
let $paneElement;
let $hiddenElement;
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
function animateSplash() {
    let $splashContent = $('#splash-content');
    $splashContent.fadeIn(200, function () {
        $splashContent.fadeOut(100, function () {
            changePage(dashboardId);
            let $splashContainer = $('#splash-container');
            let primaryContainer = $('#primary-container');
            $splashContainer.appendTo($hiddenElement);
            primaryContainer.appendTo($('.window-content'));
            primaryContainer.css('display', 'flex');
        });
    });
}
document.addEventListener('DOMContentLoaded', function () {
    $paneElement = $(`#pane-${containerId}`);
    $hiddenElement = $(`#hidden-${containerId}`);
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
    animateSplash();
});
//# sourceMappingURL=renderer.js.map