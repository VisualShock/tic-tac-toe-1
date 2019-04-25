let $container = document.getElementById('container');
let $btnStart = document.querySelector('[data-component = "btnStart"]');
let $nameInp = document.querySelector('[data-component = "name"]');
let $cells = document.querySelectorAll('[data-component="cell"]');
let $message = document.querySelector('[data-component = "showTurn"]');

let payload = {
    id: '',
    name: ''
};

const GAME = {
    website: "https://ttt-practice.azurewebsites.net"                       // Если посмотреть на то, что тут написано
};                                                                          // и вспомнить ту пирамидку, которую я рисовал на доске, то получится такая картина:
                                                                            //                 ---------
$cells = [].slice.apply($cells);                                            //                 |        | entry point - это сам скрипт, я избавился от init
$cells.forEach($cell => {                                                   //               --------------
    $cell.addEventListener('click', onCellClick);                           //               |            | начальная инициализация - это все querySelectors, и навешивание обработчиков
});                                                                         //             ------------------
                                                                            //             |                |  тут уже непосредсвенно реализация обработчиков - onButtonStart, onCellClick
$btnStart.addEventListener("click", onButtonStart);                         //          -------------------------
                                                                            //          |                       |  тут уже мой core, это методы - start, makeMove, waitMove, setMark, checkWin
                                                                            //       ------------------------------
                                                                            //       |                             | а тут уже самый низкий уровень - реализация, тут мои post, get, handleError, handleResponse и тд...
function onButtonStart() {                                                  //                      
    payload.name = $nameInp.value;                                          //       И именно в такой последовательности сверху я и реализовывал
                                                                            //
    setWaitState('Ожидание противника');

    start(payload.name)
        .then(waitMove)
        .catch(handleError)
        .finally(() => removeWaitState('Ваш ход'));
}

function onCellClick(e) {
    let index = $cells.indexOf(this);

    setWaitState('Ожидание хода противника');

    makeMove(index)
        .then(waitMove)
        .then(checkWin)
        .catch(handleError)
        .finally(() => removeWaitState('Ваш ход'));
}

function start(name) {
    return get('/start?name=' + name)
            .then(data => {
                payload.id = data.id;
                $container.classList.add('game-started');
                return data.canMove === false; // true
            });
}

function makeMove(index) {
    return post('/makeMove', Object.assign({move: index}, payload))
            .then((data) => setMark('tic', data.move, data.win));
}

function waitMove(shouldWait) {
    if (!shouldWait) {
        return;
    }

    return post('/waitMove', payload)
            .then((data) => setMark('tac', data.move));
}

function setMark(mark, move, win) {
    $cells[move].classList.add(mark);

    return !Number.isInteger(win);
}

function post(api, data) {
    let headers = new Headers();
    
    headers.append('Content-Type', 'application/json');
    
    return fetch(GAME.website + api, {
                method: 'POST' ,
                headers: headers,
                body: JSON.stringify(data)
            })
    .then(handleResponse);
}

function get(api) {
    return fetch(GAME.website + api)
            .then(handleResponse);
}

async function handleResponse(response) {
    if (!response.ok) {
        return Promise.reject('Some network error');
    }

    var json = await response.json();

    if (!json.ok) {
        return Promise.reject(json.reason);
    }

    return json.data;
}

function handleError(examinee) {
    if (examinee.reason) {
        alert(examinee.reason);
    }
    else if(examinee.status) {
        alert(examinee);
    }
    else if(examinee instanceof Error) {
        console.log(examinee);
    }
}

function setWaitState(message) {
    $container.classList.add('waiting');
    $message.innerHTML = message;
}

function removeWaitState(message) {
    $container.classList.remove('waiting');
    $message.innerHTML = message;
}

function checkWin() {

}