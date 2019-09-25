import { ipcRenderer } from 'electron';

const dashboardId: string = 'dashboard';
const trainingId: string = 'training';
const aboutId: string = 'about';
const buttonId: string = 'button';
const containerId: string = 'container';

let currentPageId: string = '';

let $paneElement: JQuery<HTMLElement>;
let $hiddenElement: JQuery<HTMLElement>;

function changePage(pageId: string): void {
    if (currentPageId !== pageId) {
        let $currentContainer: JQuery<HTMLElement> = $(`#${currentPageId}-${containerId}`);
        let $currentButton: JQuery<HTMLElement> = $(`#${currentPageId}-${buttonId}`);
        $currentContainer.css('display', 'none');
        $currentButton.removeClass('active');

        $currentContainer.appendTo($hiddenElement);

        let $newContainer: JQuery<HTMLElement> = $(`#${pageId}-${containerId}`);
        let $newButton: JQuery<HTMLElement> = $(`#${pageId}-${buttonId}`);
        $newContainer.css('display', 'inline-block');
        $newButton.addClass('active');

        $newContainer.appendTo($paneElement);
        currentPageId = pageId;
    }
}

function animateSplash(): void {
    let $splashContent = $('#splash-content');
    $splashContent.fadeIn(200, function(): void {
        $splashContent.fadeOut(100, function(): void {
            changePage(dashboardId);

            let $splashContainer = $('#splash-container');
            let primaryContainer = $('#primary-container');

            $splashContainer.appendTo($hiddenElement);
            primaryContainer.appendTo($('.window-content'));
            primaryContainer.css('display', 'flex');
        });
    });
}

document.addEventListener('DOMContentLoaded', function() {
    $paneElement = $(`#pane-${containerId}`);
    $hiddenElement = $(`#hidden-${containerId}`);

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

    animateSplash();
});
