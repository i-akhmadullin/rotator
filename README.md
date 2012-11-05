Rotator - слайдер на jQuery
=================

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
 $("#b-rotator").rotator2({
  itemsSelector: '.b-rotator__item',
  prev: '#b-rotator__prev',
  next: '#b-rotator__next',
  blocksPerScreen: 1,
  blocksChangePerPage: 1,
  //hashPrefix: "slide",
  //autoPlay: true,
  //easing: "easeOutQuad",
  keyboardNavigation: true
 });
});
```

где #b-rotator - блок внутри которого находятся слайды,
.b-rotator - селектор слайдов,
 #b-rotator__prev,#b-rotator__next - селекторы кнопок для переключения слайдов

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