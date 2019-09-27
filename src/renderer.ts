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

async function beginLoadAsync(): Promise<void> {
    $('#splash-content').fadeIn(100, async function(): Promise<void> {
        let username = process.env.username || process.env.user;
        let storage: Storage = new Storage(username);

        userData = storage.load();
        if (userData === null) {
            userData = await storage.createAsync(5);
        }

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

document.addEventListener('DOMContentLoaded', function() {
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
        ipcRenderer.send('close-main-window');
    });

    // Toolbar buttons
    $(`#minimize-${buttonId}`).on('click', function () {
        ipcRenderer.send('minimize-main-window');
    });

    $(`#exit-${buttonId}`).on('click', function () {
        ipcRenderer.send('close-main-window');
    });

    // Dashboard page functions

    // Training page functions

    // About page functions

    beginLoadAsync();
});
