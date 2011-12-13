Rotator - слайдер-монстер на jQuery
=================

Характеристики:

* В качестве слайдов могут быть как блоковые элементы, так и инлайн(с выравниванием по ширине)
* Более-менее кроссбраузерен.
* Большое поле для кастомизации и допиливания
* Поддержка нестандартных эффектов перехода между слайдов (easing)
* Частично готов для использования c Responsive design
* Сохранение номера слайда в хэше браузера(корректно работает даже при нескольких ротаторах на странице) 
* Поддержка внешних ссылок на слайды
* В сжатом виде занимает всего 9кб!

Подключение ротатора:
-----------

В файле HTML:

``` html
<link href="css/rotator.css" rel="stylesheet" type="text/css">
<script type="text/javascript" src="js/jquery.min.js"></script>
<script type="text/javascript" src="js/jquery.rotator2.min.js"></script>
```

Включение в файле javascript:

``` javascript
$(document).ready(function() {
 $("#Rotator").rotator2({
  itemsSelector: '.RotatorItem',
  prev: '#RotatorPrevLink',
  next: '#RotatorNextLink',
  blocksPerScreen: 1,
  blocksChangePerPage: 1,
  //hashPrefix: "slide",
  //autoPlay: true,
  //easing: "easeOutQuad",
  keyboardNavigation: true
 });
});
```

где #Rotator - блок внутри которого находятся слайды,
.RotatorItem - селектор слайдов,
 #RotatorPrevLink,#RotatorNextLink - селекторы кнопок для переключения слайдов


Баг-трекер
-----------

Нашли баг? Добавьте его описание в разделе issues:

https://github.com/i-akhmadullin/rotator/issues


Copyright and license
---------------------
Licensed under the Apache License, Version 2.0 (the "License"); you may not
use this file except in compliance with the License. You may obtain a copy of
the License at
http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
License for the specific language governing permissions and limitations under
the License.