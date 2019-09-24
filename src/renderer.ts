import { ipcRenderer } from "electron";

const dashboardId: string = 'dashboard';
const trainingId: string = 'training';
const aboutId: string = 'about';
let currentPageId: string = dashboardId;

let $paneElement: JQuery<HTMLElement>;
let $hiddenElement: JQuery<HTMLElement>;

function changePage(pageId: string) {
    if (currentPageId !== pageId) {
        let $currentPageElement: JQuery<HTMLElement> = $(`#${currentPageId}-main`);
        let $currentPageButton: JQuery<HTMLElement> = $(`#${currentPageId}-button`);
        $currentPageElement.css('display', 'none');
        $currentPageButton.removeClass('active');

        $currentPageElement.appendTo($hiddenElement);

        let $newPageElement: JQuery<HTMLElement> = $(`#${pageId}-main`);
        let $newPageButton: JQuery<HTMLElement> = $(`#${pageId}-button`);
        $newPageElement.css('display', 'inline-block');
        $newPageButton.addClass('active');

        $newPageElement.appendTo($paneElement);
        currentPageId = pageId;
    }
}

document.addEventListener('DOMContentLoaded', function() {
    $paneElement = $('#pane-main');
    $hiddenElement = $('#hidden');

    // Quit function
    $('#quit-button').on('click', function () {
        ipcRenderer.send('close-main-window');
    });

    // Page changing
    $(`#${dashboardId}-button`).on('click', function () {
        changePage(dashboardId);
    });

    $(`#${trainingId}-button`).on('click', function () {
        changePage(trainingId);
    });

    $(`#${aboutId}-button`).on('click', function () {
        changePage(aboutId);
    });

    // Dashboard page functions

    // Training page functions

    // About page functions

});
