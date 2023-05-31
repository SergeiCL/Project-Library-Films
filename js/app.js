import {createPage} from "./router.js";

/*****************************************************************/
/********************Глобальные переменные:***********************/
/*****************************************************************/
let checkClick = true;//Контроль запрета повторного клика при выполнении запроса фильмов
const API_KEY = "db17b310-ee30-4e3f-9fa2-e4fc81eeb9e7";
const API_URL_POPULAR = "https://kinopoiskapiunofficial.tech/api/v2.2/films/top?type=TOP_250_BEST_FILMS&page=";
const API_URL_SEARCH = "https://kinopoiskapiunofficial.tech/api/v2.1/films/search-by-keyword?keyword=";
const API_URL_MOVIE_DETAILS = "https://kinopoiskapiunofficial.tech/api/v2.2/films/";
const API_URL_MOVIE_CATEGORIES = "https://kinopoiskapiunofficial.tech/api/v2.2/films/filters";
const firebaseApp = firebase.initializeApp({
    apiKey: "AIzaSyCuD8t3dUgtAwtEL428oKIauqxofA1uA6Q",
    authDomain: "philmsportal.firebaseapp.com",
    databaseURL: "https://philmsportal-default-rtdb.europe-west1.firebasedatabase.app/",
    projectId: "philmsportal",
    storageBucket: "philmsportal.appspot.com",
    messagingSenderId: "1063323182229",
    appId: "1:1063323182229:web:93973904895f0a5910679c",
    measurementId: "G-VSC2SQTV9P"
});

const myAppDB = firebaseApp.database();

/*****************************************************************/
/*****************************************************************/
/*****************************************************************/

/**********************************************************************/
/*********Запрос и формирование страницы на API кинофильмов:***********/
/**********************************************************************/
/*Функция формирования контента на основании полученного с fetch ответа:*/        
const showFilms = data => {

    const filmsEL = document.querySelector('.movies');  
    
    document.querySelector('.movies').innerHTML = '';            

    if (localStorage.getItem('userId') !== null && localStorage.getItem('userId').length > 10) {
        const ref = myAppDB.ref('users');

        ref.once("value")
        .then(function(snapshot) {        
            const philmsInfo = snapshot.child(localStorage.getItem('userId')).val();    
            let allView = [];
            let allQueue = [];
            if (philmsInfo !== null && 'view' in philmsInfo) {
                allView = Object.keys(philmsInfo['view']);    
                allView.forEach((el, ind) => allView[ind] = parseInt(el));
            }
            if (philmsInfo !== null && 'queue' in philmsInfo) {
                allQueue = Object.keys(philmsInfo['queue']);    
                allQueue.forEach((el, ind) => allQueue[ind] = parseInt(el));
            }
            
            data.films.forEach(film => {
                const filmEl = document.createElement('div');
                filmEl.setAttribute('data-id', film.filmId);
                
                filmEl.classList.add('movie');
                if (allView.indexOf(film.filmId) !== -1) {
                    filmEl.classList.add('view__philm');
                }
                if (allView.indexOf(film.filmId) !== -1 && 'live' in philmsInfo['view'][film.filmId]) {
                    filmEl.classList.remove('view__philm');
                    filmEl.classList.add('live__philm_border');
                }
                filmEl.innerHTML = ` 
                <div class = "movie__cover-inner">
                    <img src = "${film.posterUrlPreview}" class = "movie__cover" alt = "${film.nameRu}"/>
                    <div class = "movie__cover--darkened"></div>
                </div>
                <div class = "movie__info">
                    <div class = "movie__title">"${film.nameRu}"</div>
                    <div class = "movie__category">${film.genres.map((gen) => ` ${gen.genre}`)}</div>
            ${(film.rating !== "null") ?
                    '<div class = "movie__average movie__average--${getRating(film.rating)}">' + film.rating + '</div>' : "<div></div>"}
                </div>`;                    
                filmsEL.append(filmEl);
                filmEl.onclick = (e) => {            
                    localStorage.setItem('id', film.filmId);       
                    localStorage.setItem('name', film.nameRu);   
                    
                    location.hash = `#oneMovie`;                        
                }
        
            });         

        });
    } else {
        
        data.films.forEach((film) => {
            const filmEl = document.createElement('div');
            filmEl.setAttribute('data-id', film.filmId);
            
            filmEl.classList.add('movie');
            filmEl.innerHTML = ` 
            <div class = "movie__cover-inner">
                <img src = "${film.posterUrlPreview}" class = "movie__cover" alt = "${film.nameRu}"/>
                <div class = "movie__cover--darkened"></div>
            </div>
            <div class = "movie__info">
                <div class = "movie__title">"${film.nameRu}"</div>
                <div class = "movie__category">${film.genres.map((gen) => ` ${gen.genre}`)}</div>
        ${(film.rating !== "null") ?
                '<div class = "movie__average movie__average--${getRating(film.rating)}">' + film.rating + '</div>' : "<div></div>"}
            </div>`;                    
            filmsEL.append(filmEl);
            filmEl.onclick = (e) => {            
                localStorage.setItem('id', film.filmId);   
                localStorage.setItem('name', film.nameRu);   
                location.hash = `#oneMovie`;                        
            }
    
        });        
    }

    
    if (data.pagesCount && data.pagesCount > 1) {

        showPagination(data.pagesCount);

    } else {
        hidePagination();
    }
    checkClick = true;
}

/*Функция запросов к поратлу поиска кинофильмов:*/
const getFilms = async url => {

    const pageItem = localStorage.getItem('page');
    const keywordItem = localStorage.getItem('keyword');
    const typeItem = localStorage.getItem('type');

    if (typeItem == 'top') {
        url = url + ((pageItem) ? `${pageItem}` : '1');
    } else if (typeItem == 'search') {
        url = url + ((pageItem) ? `&page=${pageItem}` : '&page=1');
    }        
    
    const response = await fetch(url, {
        headers: {
        "Content-Type": "application/json",
        "X-API-KEY": API_KEY,                
        },
    });
    
    const responseFilms = await response.json();

    showFilms(responseFilms);                
}
const getInformationAboutFilm = async id => {

    const response = await fetch(API_URL_MOVIE_DETAILS + id, {
        headers: {
        "Content-Type": "application/json",
        "X-API-KEY": API_KEY,
        },
    });
    const responseFilms = await response.json();

    const infoWindow = document.querySelector('.modal');    
    
    if (localStorage.getItem('userId') !== null && localStorage.getItem('userId').length > 10) {
        const ref = myAppDB.ref('users');

        ref.once("value")
        .then(function(snapshot) {        
            const philmsInfo = snapshot.child(localStorage.getItem('userId')).val();    
            let allView = [];
            let allQueue = [];
            if (philmsInfo !== null && 'view' in philmsInfo) {
                allView = Object.keys(philmsInfo['view']);    
                allView.forEach((el, ind) => allView[ind] = parseInt(el));
            }
            if (philmsInfo !== null && 'queue' in philmsInfo) {
                allQueue = Object.keys(philmsInfo['queue']);    
                allQueue.forEach((el, ind) => allQueue[ind] = parseInt(el));
            }
            
            localStorage.setItem('url', responseFilms.webUrl);

            infoWindow.innerHTML = `
            <div class="modal__card">
            <img class="modal__movie-backdrop ${(allView.indexOf(responseFilms.kinopoiskId) == -1) ? '' : 'view__super'}" src="${responseFilms.posterUrl}" alt="">
            <h2>
                <span class="modal__movie-title">${responseFilms.nameRu}</span>
                <span class="modal__movie-release-year">${responseFilms.year}</span>
            </h2>
            <ul class="modal__movie-info">
                <div class="loader"></div>
                <li class="modal__movie-genre">Жанр - ${responseFilms.genres.map((el) => `<span>${el.genre}</span>`)}</li>
                ${responseFilms.filmLength ? `<li class="modal__movie-runtime">Время - ${responseFilms.filmLength} минут</li>` : ''}
                <li >Сайт: <a class="modal__movie-site" href="${responseFilms.webUrl}">${responseFilms.webUrl}</a></li>
                <li class="modal__movie-overview">Описание - ${responseFilms.description}</li>
            </ul>
            <div class="control__panel ${(localStorage.getItem('userId') !== null && localStorage.getItem('userId').length > 10) ? '' : 'hide'}">
                <button type="button" class="modal__button modal__button-view ${(allView.indexOf(responseFilms.kinopoiskId) == -1) ? '' : 'hide'}" id="view">Смотрел</button>
                <button type="button" class="modal__button modal__button-notview ${(allView.indexOf(responseFilms.kinopoiskId) == -1) ? 'hide' : ''}" id="notview">Не смотрел</button>
                <button type="button" class="modal__button modal__button-queue ${(allQueue.indexOf(responseFilms.kinopoiskId) == -1) ? '' : 'hide'}" id="queue">В очередь</button>
                <button type="button" class="modal__button modal__button-notqueue ${(allQueue.indexOf(responseFilms.kinopoiskId) == -1) ? 'hide' : ''}" id="notqueue">Из очереди</button>
            </div>
            <button type="button" class="modal__button modal__button-close" id="modal-close">Назад</button>
            </div>`;

        });   

    } else {
        infoWindow.innerHTML = `
        <div class="modal__card">
        <img class="modal__movie-backdrop" src="${responseFilms.posterUrl}" alt="">
        <h2>
            <span class="modal__movie-title">${responseFilms.nameRu}</span>
            <span class="modal__movie-release-year">${responseFilms.year}</span>
        </h2>
        <ul class="modal__movie-info">
            <div class="loader"></div>
            <li class="modal__movie-genre">Жанр - ${responseFilms.genres.map((el) => `<span>${el.genre}</span>`)}</li>
            ${responseFilms.filmLength ? `<li class="modal__movie-runtime">Время - ${responseFilms.filmLength} минут</li>` : ''}
            <li >Сайт: <a class="modal__movie-site" href="${responseFilms.webUrl}">${responseFilms.webUrl}</a></li>
            <li class="modal__movie-overview">Описание - ${responseFilms.description}</li>
        </ul>        
        <button type="button" class="modal__button modal__button-close" id="modal-close">Назад</button>
        </div>`;
    }

    
}
/************************************************/
/************************************************/
/************************************************/



/***************************************/
/***************Пагинация:**************/
/***************************************/
const showPagination = (pages) => {
    
    const currentPageValueContainer = document.getElementById('current-page');
    const maxPageValueContainer = document.getElementById('max-page');
    const prevPageButton = document.getElementById('prev-page');
    const nextPageButton = document.getElementById('next-page');

    document.querySelector('.pagination').classList.remove('hide');

    const pageItem = localStorage.getItem('page');

    currentPageValueContainer.innerHTML = pageItem;
    maxPageValueContainer.innerHTML = pages;

    if (pageItem == '1' || !pageItem) {
        prevPageButton.setAttribute('disabled', true);
    } else {
        prevPageButton.removeAttribute('disabled');
    }
    if (pageItem == pages) {
        nextPageButton.setAttribute('disabled', true);
    } else {
        nextPageButton.removeAttribute('disabled');
    }
}

const hidePagination = () => {
    document.querySelector('.pagination').classList.add('hide');
}

const showPrevPage = () => {
    const currentPage = document.getElementById('current-page');
    const currentPageValue = parseInt(currentPage.innerHTML);        
    const typeItem = localStorage.getItem('type');  
    const keywordItem = localStorage.getItem('keyword');  
    
    if (currentPageValue == 1 || !checkClick) return;

    checkClick = false;

    if (typeItem == 'top') {        

        localStorage.setItem('page', (currentPageValue - 1).toString());        
        getFilms(API_URL_POPULAR, currentPageValue - 1);        

    } else if (typeItem == 'search') {
        
        const searchUrl = `${API_URL_SEARCH}${keywordItem}`;
        localStorage.setItem('page', (currentPageValue - 1).toString());                
        getFilms(searchUrl, currentPageValue - 1);

    }    
}

const showNextPage = () => {
    const currentPage = document.getElementById('current-page');
    const currentPageValue = parseInt(currentPage.innerHTML);
    const maxPageValue = parseInt(document.getElementById('max-page').innerHTML);
    const typeItem = localStorage.getItem('type');  
    const keywordItem = localStorage.getItem('keyword');  


    if (currentPageValue == maxPageValue || !checkClick) return;

    checkClick = false;    
    
    if (typeItem == 'top') {

        localStorage.setItem('page', (currentPageValue + 1).toString());        ;
        getFilms(API_URL_POPULAR, currentPageValue + 1);
        
    } else if (typeItem == 'search') {
        
        const searchUrl = `${API_URL_SEARCH}${keywordItem}`;
        localStorage.setItem('page', (currentPageValue + 1).toString());                
        getFilms(searchUrl, currentPageValue + 1);
        
    }    
}
/***************************************/
/***************************************/
/***************************************/

/*Авторизация:*/
const showSignup = () => {
    document.getElementById('login-form').style.marginLeft = "-50%";
    document.getElementById('title-login').style.marginLeft = "-50%";
}
const showLogin = () => {
    document.getElementById('login-form').style.marginLeft = "0%";
    document.getElementById('title-login').style.marginLeft = "0%";
}
const checkLogin = () => {
    const login = document.getElementById('login-mail').value.trim();
    const pass = document.getElementById('login-pass').value.trim();
    if (login.indexOf('@') == -1 || !login.split('@')[1]) return false;
    if (pass == '') return false;    
    return true;
}
const checkSignup = () => {
    const login = document.getElementById('signup-mail').value.trim();
    const pass = document.getElementById('signup-pass').value.trim();
    const pass2 = document.getElementById('signup-pass2').value.trim();
    if (login.indexOf('@') == -1 || !login.split('@')[1]) return false;
    if (pass == '' || pass2 == '' || pass != pass2) return false;    
    return true;
}
const sendLoginData = async (email, password) => {
    document.getElementById('login-error').innerHTML = '';
    try {
        const data = await firebase.auth().signInWithEmailAndPassword(email, password)
        console.log(data.user.uid);          
        localStorage.setItem('userId', data.user.uid);        
        location.hash = '#main';
                
    } catch (error) {
        document.getElementById('login-error').innerHTML = 'Пароль не верен либо пользователь отсутствует';        
    }
}

function writeUserData(userId, name, email) {
    myAppDB.ref('users/' + userId).set({
      username: name,
      email: email
    }).then(function () {
        console.log("Пользователь добавлен в коллецию users");
      })
      .catch(function (error) {
        console.error("Ошибка добавления пользователя: ", error);
      });
}

const sendSignupData = async (email, password) => {
    try {
        const data = await firebase.auth().createUserWithEmailAndPassword(email, password)
        console.log(data.user.uid);
        localStorage.setItem('userId', data.user.uid);                                
        location.hash = '#main';
        
    } catch (error) {
        document.getElementById('signup-error').innerHTML = error.message;
    }
  }

const removeViewPhilm = (philmId, userId, refer) => {    
    myAppDB
        .ref(`users/${userId}/${refer}/${philmId}`)
        .remove()
        .then(function () {
            switch (refer) {
                case 'view':
                    document.getElementById('view').classList.remove('hide');
                    document.getElementById('notview').classList.add('hide');
                    document.querySelector('.modal__movie-backdrop').classList.remove('view__super');
                    break;        
                case 'queue':
                    document.getElementById('queue').classList.remove('hide');
                    document.getElementById('notqueue').classList.add('hide');
                    break;        
            }       
        })
        .catch(function (error) {
            console.error("Ошибка удаления фильма: ", error);
        });
}

const addViewPhilm = (philmId, userId, refer, namePhilm, philmUrl) => {
    console.log(philmId);    
    myAppDB.ref(`users/${userId}/${refer}/${philmId}`).set(
        {'name': namePhilm,
         'url': philmUrl
        }
    ).then(function () {
        switch (refer) {
            case 'view':
                document.getElementById('view').classList.add('hide');
                document.getElementById('notview').classList.remove('hide');
                document.querySelector('.modal__movie-backdrop').classList.add('view__super');
                break;        
            case 'queue':
                document.getElementById('queue').classList.add('hide');
                document.getElementById('notqueue').classList.remove('hide');
                break;        
        }        
    })
    .catch(function (error) {
        console.error("Ошибка добавления фильма в просмотренные: ", error);
    });
}
  
const removeQueueInfo = (philmId, userId, refer) => {    
    console.log(`users/${userId}/${refer}/${philmId}`);
    myAppDB
        .ref(`users/${userId}/${refer}/${philmId}`)
        .remove()
        .then(function () {
            switch (refer) {
                case 'view':
                    document.getElementById(`view${philmId}`).remove();
                    break;        
                case 'queue':
                    document.getElementById(`queue${philmId}`).remove();                    
                    break;        
            }       
        })
        .catch(function (error) {
            console.error("Ошибка удаления фильма: ", error);
        });
}

function setLive(userId, id) {
    console.log(id);    
    console.log(userId);    
    const urlPhilm = (document.querySelector(`#view${id} .view__action`)).getAttribute('data-url');
    const namePhilm = (document.querySelector(`#view${id} p`)).innerHTML;
    myAppDB.ref(`users/${userId}/view/${id}`).set(
        {'live': true,
         'name': namePhilm,
         'url': urlPhilm
        }        
    ).then(function () {
        document.querySelector(`#view${id} .view__live`).setAttribute('disabled', true);
        document.querySelector(`#view${id} p`).classList.add('live__philm');
    })
    .catch(function (error) {
        console.error("Ошибка добавления фильма в любимые: ", error);
    });
}

/***********************************************************************/
/*********************Маршрутизация обработчиков событий****************/
/***********************************************************************/
/*Роутинг форм:*/
const formRouter = e => {

    e.preventDefault();
    e.stopPropagation();
    
    const findValue = document.getElementById('header-search').value.trim();
    
    switch (e.target.id) {
        case 'find-movies':
        case 'header-search':                   
            localStorage.setItem('page', '1');            
            localStorage.setItem('keyword', findValue);
            localStorage.setItem('type', 'search');     
            if (location.hash == '#search') {   
                if (document.getElementById('county').value == '' && document.getElementById('type').value == '') {
                    getFilms(`${API_URL_SEARCH}${findValue}`, 1);                           
                } else {                    
                    getFilms(`https://kinopoiskapiunofficial.tech/api/v2.2/films?genres=${document.getElementById('type').value}&countries=${document.getElementById('county').value}&keyword=${findValue}`, 1);                    
                    
                }                             
             } else {                
                location.hash = '#search';
            }            
            break;            
    }
}
/*Роутинг кликов:*/
const clickRouter = (e) => {    
    const sound = document.getElementById("audio");
    sound.play();
    

    if (e.target.tagName == 'A') {
        e.preventDefault();                
    }    
    if (e.target.classList.contains('view__live')) {
        setLive(localStorage.getItem('userId'), e.target.getAttribute('data-id'));
        return;
    }
    if (e.target.classList.contains('modal__movie-site')) {
        window.open(e.target.href, '_blank', 'location=yes,height=400,width=400,scrollbars=yes,status=yes');        
        return;
    }
    if (e.target.classList.contains('view__action') || e.target.classList.contains('queue__action')) {
        window.open(e.target.getAttribute('data-url'), '_blank', 'location=yes,height=400,width=400,scrollbars=yes,status=yes');     
        return;
    }
    if (e.target.classList.contains('queue__delete')) {
        removeQueueInfo(e.target.getAttribute('data-id'), localStorage.getItem('userId'), 'queue');
        return;
    }
    if (e.target.classList.contains('view__delete')) {
        removeQueueInfo(e.target.getAttribute('data-id'), localStorage.getItem('userId'), 'view');
        return;
    }
    switch (e.target.id) {
        case 'find-philms':
            const findValue = document.getElementById('header-search').value.trim();
            localStorage.setItem('page', '1');            
            localStorage.setItem('keyword', findValue);
            localStorage.setItem('type', 'search');     
            if (location.hash == '#search') {   
                if (document.getElementById('county').value == '' && document.getElementById('type').value == '') {
                    getFilms(`${API_URL_SEARCH}${findValue}`, 1);                           
                } else {                    
                    getFilms(`https://kinopoiskapiunofficial.tech/api/v2.2/films?genres=${document.getElementById('type').value}&countries=${document.getElementById('county').value}&keyword=${findValue}`, 1);                    
                    
                }                             
              
            } else {                
                location.hash = '#search';
            } 
            break;
        case 'view':
            addViewPhilm(localStorage.getItem('id'), localStorage.getItem('userId'), 'view', localStorage.getItem('name'), localStorage.getItem('url'));
            break;
        case 'queue':
            addViewPhilm(localStorage.getItem('id'), localStorage.getItem('userId'), 'queue', localStorage.getItem('name'),localStorage.getItem('url'));
            break;
        case 'notview':
            removeViewPhilm(localStorage.getItem('id'), localStorage.getItem('userId'), 'view');
            break;
        case 'notqueue':
            removeViewPhilm(localStorage.getItem('id'), localStorage.getItem('userId'), 'queue');
            break;
        case 'prev-page':
            showPrevPage();
            break;
        case 'next-page':
            showNextPage();            
            break;
        case 'main-logo':
        case 'main-link':
            location.hash="#main";
            break;
        case 'room-link':
            location.hash="#room";
            break;
        case 'security-link':
            location.hash="#security";
            break;
        case 'modal-close':
            if (localStorage.getItem('type') !== 'null' && localStorage.getItem('type') == 'search') {
                location.hash="#search";
            } else {
                location.hash="#main";
            }
            break;
        case 'login-action':
            showLogin();            
            break;
        case 'signup-action':
            showSignup();            
            break;
        case 'login-submit':
            if (checkLogin()) {            
                sendLoginData(document.getElementById('login-mail').value.trim(), document.getElementById('login-pass').value.trim());                
            }            
            break;
        case 'signup-submit':
            if (checkSignup()) {            
                sendSignupData(document.getElementById('signup-mail').value.trim(), document.getElementById('signup-pass').value.trim());                
            }   
            break;
        case 'logout-link':
            localStorage.setItem('userId', '0');
            location.reload();
            break;
    }
}
/***********************************************************************/
/***********************************************************************/
/***********************************************************************/

/*Личный кабинет (для сбора данных и формирования личного кабинета):*/
const createRoom = () => {
    const ref = myAppDB.ref('users');

    ref.once("value")
    .then(function(snapshot) {        
        const philmsInfo = snapshot.child(localStorage.getItem('userId')).val();   
        return philmsInfo;
    }).then(philmsInfo => {
    
        let allView = [];
        let allQueue = [];
        
        let queuesContent = '';
        if (philmsInfo !== null && 'queue' in philmsInfo) {
            let queuesContent = '';
            allQueue = Object.keys(philmsInfo['queue']);                
            
            allQueue.forEach((el, ind) => allQueue[ind] = parseInt(el));

            allQueue.forEach(el => {
                queuesContent += `<div class="queue_block" id="queue${el}"><p>${philmsInfo['queue'][el]['name']}</p><button class="queue__action" data-url="${philmsInfo['queue'][el]['url']}">Смотреть</button><button class="queue__delete" data-id="${el}">Удалить</button></div>`;
            });    
            setTimeout(() => {
                document.querySelector('.queues').innerHTML = queuesContent;    
            }, 500);            
        } else {

        }
        
        if (philmsInfo !== null && 'view' in philmsInfo) {
            let viewContent = '';
            allView = Object.keys(philmsInfo['view']); 
            
            allView.forEach((el, ind) => allView[ind] = parseInt(el));

            allView.forEach(el => {
                viewContent += `<div class="view_block" id="view${el}"><p class="${(philmsInfo['view'][el]['live']) ? 'live__philm' : ''}">${philmsInfo['view'][el]['name']}</p><button class="view__live" data-id="${el}" ${(philmsInfo['view'][el]['live']) ? 'disabled' : ''}>Любимый</button><button class="view__action" data-url="${philmsInfo['view'][el]['url']}">Смотреть</button><button class="view__delete" data-id="${el}">Удалить</button></div>`;
            });    
            setTimeout(() => {
                document.querySelector('.views').innerHTML = viewContent;
            }, 500);                    
        } else {

        }            
        
    });
}

/********************************/
/*************Навигация**********/
/********************************/
/*Объект указателей для навигации:*/
const links = {
    main: 'main', 
    room: 'room',
    security: 'security',
    oneMovie: 'oneMovie',
    search: 'search'
};
/*Управляющая функция навигации:*/
const updateState = () => {

    let contentHash = links[location.hash.slice(1)];        
   
    createPage(contentHash);    

    const pageItem = localStorage.getItem('page');
    const keywordItem = localStorage.getItem('keyword');
    const typeItem = localStorage.getItem('type');

    switch (contentHash) {
        case 'main':
            if (typeItem == 'search' || (typeItem == 'top' && (pageItem == '1' || !pageItem))) {
                localStorage.setItem('page', '1');
                localStorage.setItem('keyword', '');
                localStorage.setItem('type', 'top');                
                getFilms(API_URL_POPULAR, 1);                  
            } else {                
                getFilms(API_URL_POPULAR, pageItem);
            }       
            break;
        case 'search':
            if (typeItem == 'top' || (typeItem == 'search' && (pageItem == '1' || !pageItem))) {
                localStorage.setItem('page', '1');                
                localStorage.setItem('type', 'search');                
                getFilms(`${API_URL_SEARCH}${keywordItem}`, 1);
            } else {                
                getFilms(`${API_URL_SEARCH}${keywordItem}`, pageItem);
            }                
            break;
        case 'oneMovie':
            getInformationAboutFilm(localStorage.getItem('id'));
            break;
        case 'room':
            if (localStorage.getItem('userId') && localStorage.getItem('userId').length > 10) {
                createRoom();                
            } else {
                location.hash = '#main';                
            }
            break;
    }
    
}
/********************************/
/********************************/
/********************************/

/*Основные обработчики:*/
document.addEventListener('click', clickRouter);

window.addEventListener('submit', formRouter);
//*Происходит вся навигация по этому событию*/
window.addEventListener('hashchange', updateState);
window.addEventListener('load', (e) => {
    if (!document.referrer) {
        localStorage.setItem('page', '1');
        localStorage.setItem('keyword', '');
        localStorage.setItem('type', 'top');
        localStorage.setItem('userId', '0');
    }            
    if (location.hash.slice(1) == 'search') {
        location.hash = '#main';
    } else {
        location.hash.slice(1) ? updateState() : location.hash = '#main';        
    }    
});
window.addEventListener('unload', (e) => {
    localStorage.setItem('page', '1');
    localStorage.setItem('keyword', '');
    localStorage.setItem('type', 'top');    
    localStorage.setItem('userId', '0');    
});
