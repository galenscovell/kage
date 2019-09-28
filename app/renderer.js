"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
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
let storage = new storage_1.Storage(process.env.username || process.env.user);
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
function beginLoad() {
    $('#splash-content').fadeIn(100, function () {
        return __awaiter(this, void 0, void 0, function* () {
            userData = storage.load();
            endLoad();
        });
    });
}
function endLoad() {
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
function createData(entriesPerPack) {
    return __awaiter(this, void 0, void 0, function* () {
        userData = yield storage.createAsync(entriesPerPack);
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
    $(`#${dashboardId}-regenerate-switch-input`).on('click', function () {
        let $regenButton = $(`#${dashboardId}-regenerate-${buttonId}`);
        if ($regenButton.hasClass('disabled')) {
            $regenButton.removeClass('disabled');
        }
        else {
            $regenButton.addClass('disabled');
        }
    });
    $(`#${dashboardId}-regenerate-${buttonId}`).on('click', function () {
        createData(5);
    });
    // Training page functions
    // About page functions
    beginLoad();
});
//# sourceMappingURL=renderer.js.map