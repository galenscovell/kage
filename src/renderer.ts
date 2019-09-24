import { ipcRenderer } from "electron";

const dashboardId: string = 'dashboard';
const trainingId: string = 'training';
const aboutId: string = 'about';
const buttonId: string = 'button';
const mainId: string = 'main';

let currentPageId: string = '';

let $paneElement: JQuery<HTMLElement>;
let $hiddenElement: JQuery<HTMLElement>;

function changePage(pageId: string) {
    if (currentPageId !== pageId) {
        let $currentPageElement: JQuery<HTMLElement> = $(`#${currentPageId}-${mainId}`);
        let $currentPageButton: JQuery<HTMLElement> = $(`#${currentPageId}-${buttonId}`);
        $currentPageElement.css('display', 'none');
        $currentPageButton.removeClass('active');

        $currentPageElement.appendTo($hiddenElement);

        let $newPageElement: JQuery<HTMLElement> = $(`#${pageId}-${mainId}`);
        let $newPageButton: JQuery<HTMLElement> = $(`#${pageId}-${buttonId}`);
        $newPageElement.css('display', 'inline-block');
        $newPageButton.addClass('active');

        $newPageElement.appendTo($paneElement);
        currentPageId = pageId;
    }
}

document.addEventListener('DOMContentLoaded', function() {
    $paneElement = $(`#pane-${mainId}`);
    $hiddenElement = $(`#hidden-${mainId}`);

    // Quit function
    $(`#quit-${buttonId}`).on('click', function () {
        ipcRenderer.send('close-main-window');
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
