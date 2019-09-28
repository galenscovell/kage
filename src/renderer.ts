import {ipcRenderer} from 'electron';
import {UserData} from "./models/userData";
import {Storage} from './storage';


const dashboardId: string = 'dashboard';
const trainingId: string = 'training';
const aboutId: string = 'about';
const buttonId: string = 'button';
const containerId: string = 'container';

let currentPageId: string = '';

let $paneElement: JQuery<HTMLElement>;
let $hiddenElement: JQuery<HTMLElement>;

let storage: Storage = new Storage(process.env.username || process.env.user);
let userData: UserData;


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

function beginLoad(): void {
    $('#splash-content').fadeIn(100, async function(): Promise<void> {
        userData = storage.load();
        endLoad();
    });
}

function endLoad(): void {
    $('#splash-content').fadeOut(100, function(): void {
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

async function createData(entriesPerPack: number): Promise<void> {
    userData = await storage.createAsync(entriesPerPack);
}

document.addEventListener('DOMContentLoaded', function(): void {
    $paneElement = $(`#pane-${containerId}`);
    $hiddenElement = $(`#hidden-${containerId}`);

    // Nav bar buttons
    $(`#${dashboardId}-${buttonId}`).on('click', function(): void {
        changePage(dashboardId);
    });

    $(`#${trainingId}-${buttonId}`).on('click', function(): void {
        changePage(trainingId);
    });

    $(`#${aboutId}-${buttonId}`).on('click', function(): void {
        changePage(aboutId);
    });

    $(`#quit-${buttonId}`).on('click', function(): void {
        ipcRenderer.send('close-main-window');
    });

    // Toolbar buttons
    $(`#minimize-${buttonId}`).on('click', function(): void {
        ipcRenderer.send('minimize-main-window');
    });

    $(`#exit-${buttonId}`).on('click', function(): void {
        ipcRenderer.send('close-main-window');
    });

    // Dashboard page functions
    $(`#${dashboardId}-regenerate-switch-input`).on('click', function(): void {
        let $regenButton: JQuery<HTMLElement> = $(`#${dashboardId}-regenerate-${buttonId}`);

        if ($regenButton.hasClass('disabled')) {
            $regenButton.removeClass('disabled');
        } else {
            $regenButton.addClass('disabled');
        }
    });

    $(`#${dashboardId}-regenerate-${buttonId}`).on('click', function(): void {
        createData(5);
    });

    // Training page functions

    // About page functions

    beginLoad();
});
