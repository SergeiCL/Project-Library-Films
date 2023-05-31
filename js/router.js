/*Основная функция формирования страницы, на которую осуществляется переход:*/
const createPage = pageName => {

    const container = document.getElementById('container');
    container.innerHTML = '';
    /*Вставка контента на страницу*/
    const innerElement = el => container.insertAdjacentHTML('beforeend', el);
        
    const getData = el => fetch(`templates/${el}`).then(function(r){ return r.text() });
    
    const getTeplate = async (...allUrls) => {        
        try {

            const allFetches = [];            

            allUrls.forEach((el, ind) => allFetches[ind] = getData(el));

            const data = await Promise.all(allFetches);
            
            data.forEach(el => innerElement(el));

            /*Добавляем жанры и страны:*/
            const API_KEY = "db17b310-ee30-4e3f-9fa2-e4fc81eeb9e7";
            const API_URL_MOVIE_CATEGORIES = "https://kinopoiskapiunofficial.tech/api/v2.2/films/filters";    
            fetch(API_URL_MOVIE_CATEGORIES, {
                headers: {
                "Content-Type": "application/json",
                "X-API-KEY": API_KEY,                
                },
            }).then(data => data.json())
            .then(res => {
                const genreElement = document.getElementById('type');
                const countryElement = document.getElementById('county');
                res.genres.forEach(el => {
                    if (el.genre.trim() !== '') {
                        const newEl = document.createElement('option');
                        newEl.value = el.id;
                        newEl.innerHTML = (el.genre.trim().length > 15) ? el.genre.trim().slice(0, 12) + '...' : el.genre.trim();
                        genreElement.append(newEl);    
                    }                    
                });
                res.countries.forEach(el => {
                    if (el.country.trim() != '') {
                        const newEl = document.createElement('option');
                        newEl.value = el.id;
                        newEl.innerHTML = (el.country.trim().length > 15) ? el.country.trim().slice(0, 12) + '...' : el.country.trim();
                        countryElement.append(newEl);    
                    }                    
                });
                console.log(res);
            });

        } catch(error) {
            console.log(error);
        }                
    }    
          /*Проверка на валидацию пользователя */ 
    let checkSession = false;
    if (localStorage.getItem('userId') !== null) {
        if (localStorage.getItem('userId').trim().length > 10) {
            checkSession = true;    
        } else {
            checkSession = false;
        }
    } else {
        checkSession = false;
    }
    
    const headerTemplate = (checkSession) ? 'authorised_header.html' :  'main_header.html';

    switch (pageName) {
        case 'main':            
            getTeplate(headerTemplate, 'main.html', 'footer.html');
            break;
        case 'room':
            if (checkSession) {
                getTeplate(headerTemplate, 'personal_page.html', 'footer.html');    
            } else {
                getTeplate(headerTemplate, 'main.html', 'footer.html');
            }            
            break;        
        case 'security':
            getTeplate(headerTemplate, 'form.html', 'footer.html');
            break;
        case 'oneMovie':
            getTeplate(headerTemplate, 'one_movie.html', 'footer.html');
            break;
        case 'search':
            getTeplate(headerTemplate, 'main.html', 'footer.html');
            break;
    }    
}

export {createPage};