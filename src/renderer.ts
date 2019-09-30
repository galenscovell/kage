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
let userData: UserData = null;


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

function init(): void {
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

            if (!userData.dayHasPassedSinceLastStudied()) {
                $(`#${trainingId}-${buttonId}`).addClass('disabled');
            }
        });
    });
}

async function createData(entriesPerPack: number): Promise<void> {
    userData = await storage.createAsync(entriesPerPack);
}

function loadDashboard(): void {
    userData = storage.load();

    if (userData !== null) {
        $(`#${dashboardId}-reps-value`).text(`${userData.currentReps} reps`);
        $(`#${dashboardId}-main-middle`).text(userData.getFormattedDateString());
        $(`#${dashboardId}-sources`).text(userData.getFormattedSourcesString());
        $(`#${dashboardId}-progress-value`).text(userData.getFormattedCompletionString());
        $(`#${dashboardId}-progress-bar.bar.progress`).attr('width', userData.getFormattedCompletionPctString());
    } else {
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
        ipcRenderer.send('close-main-window');
    });

    // Toolbar buttons
    $(`#minimize-${buttonId}`).on('click', () => {
        ipcRenderer.send('minimize-main-window');
    });

    $(`#exit-${buttonId}`).on('click', () => {
        ipcRenderer.send('close-main-window');
    });

    // Dashboard page functions
    $(`#${dashboardId}-regenerate-switch-input`).on('click', () => {
        let $regenButton: JQuery<HTMLElement> = $(`#${dashboardId}-regenerate-${buttonId}`);

        if ($regenButton.hasClass('disabled')) {
            $regenButton.removeClass('disabled');
        } else {
            $regenButton.addClass('disabled');
        }
    });

    $(`#${dashboardId}-regenerate-${buttonId}`).on('click', async () => {
        await createData(5).then(() => {
            loadDashboard();
        });

        // Reset the regen switch and button
        $(`#${dashboardId}-regenerate-switch-input`).trigger('click');
    });

    // Training page functions


    init();
});
