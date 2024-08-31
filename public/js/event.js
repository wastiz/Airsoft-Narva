console.log('Hello');
const btns = document.querySelectorAll(".lang-btn")
const divs = document.querySelectorAll('.lang-div')

btns[0].addEventListener('click', (e) => {
    divs[0].classList.remove('hidden');
    divs[1].classList.add('hidden')
    divs[2].classList.add('hidden')
})

btns[1].addEventListener('click', (e) => {
    divs[1].classList.remove('hidden');
    divs[0].classList.add('hidden')
    divs[2].classList.add('hidden')
})

btns[2].addEventListener('click', (e) => {
    divs[2].classList.remove('hidden');
    divs[0].classList.add('hidden')
    divs[1].classList.add('hidden')
})