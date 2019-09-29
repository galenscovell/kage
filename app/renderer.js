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
let userData = null;
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
function init() {
    $('#splash-content').fadeIn(500, () => {
        $('#splash-content').fadeOut(500, () => {
            let $header = $('#header');
            let $primaryContent = $(`#primary-${containerId}`);
            $(`#splash-${containerId}`).appendTo($hiddenElement);
            $header.prependTo($('.window'));
            $primaryContent.appendTo($('.window-content'));
            $header.css('display', 'inline-block');
            $primaryContent.css('display', 'flex');
            loadDashboard();
            changePage(dashboardId);
        });
    });
}
function createData(entriesPerPack) {
    return __awaiter(this, void 0, void 0, function* () {
        userData = yield storage.createAsync(entriesPerPack);
    });
}
function loadDashboard() {
    userData = storage.load();
    if (userData !== null) {
        $(`#${dashboardId}-reps-value`).text(`${userData.currentReps} reps`);
        $(`#${dashboardId}-main-middle`).text(userData.getFormattedDateString());
        $(`#${dashboardId}-sources`).text(userData.getFormattedSourcesString());
        $(`#${dashboardId}-progress-value`).text(userData.getFormattedCompletionString());
        $(`#${dashboardId}-progress-bar.bar.progress`).attr('width', userData.getFormattedCompletionPctString());
    }
    else {
        $(`#${dashboardId}-reps-value`).text('No rep data');
        $(`#${dashboardId}-main-middle`).text('No date data');
        $(`#${dashboardId}-sources`).text('No source data');
        $(`#${dashboardId}-progress-value`).text('No completion data');
        $(`#${dashboardId}-progress-bar.bar.progress`).attr('width', '0%');
    }
}
document.addEventListener('DOMContentLoaded', () => {
    $paneElement = $(`#pane-${containerId}`);
    $hiddenElement = $(`#hidden-${containerId}`);
    // Nav bar buttons
    $(`#${dashboardId}-${buttonId}`).on('click', () => {
        loadDashboard();
        changePage(dashboardId);
    });
    $(`#${trainingId}-${buttonId}`).on('click', () => {
        changePage(trainingId);
    });
    $(`#${aboutId}-${buttonId}`).on('click', () => {
        changePage(aboutId);
    });
    $(`#quit-${buttonId}`).on('click', () => {
        electron_1.ipcRenderer.send('close-main-window');
    });
    // Toolbar buttons
    $(`#minimize-${buttonId}`).on('click', () => {
        electron_1.ipcRenderer.send('minimize-main-window');
    });
    $(`#exit-${buttonId}`).on('click', () => {
        electron_1.ipcRenderer.send('close-main-window');
    });
    // Dashboard page functions
    $(`#${dashboardId}-regenerate-switch-input`).on('click', () => {
        let $regenButton = $(`#${dashboardId}-regenerate-${buttonId}`);
        if ($regenButton.hasClass('disabled')) {
            $regenButton.removeClass('disabled');
        }
        else {
            $regenButton.addClass('disabled');
        }
    });
    $(`#${dashboardId}-regenerate-${buttonId}`).on('click', () => __awaiter(void 0, void 0, void 0, function* () {
        yield createData(5).then(() => {
            loadDashboard();
        });
        // Reset the regen switch and button
        $(`#${dashboardId}-regenerate-switch-input`).trigger('click');
    }));
    // Training page functions
    // About page functions
    init();
});
//# sourceMappingURL=renderer.js.map