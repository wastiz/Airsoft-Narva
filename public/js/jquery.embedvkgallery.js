var vkApi = 'https://api.vk.com/method/photos.get';
var access_token = '9180ed569180ed569180ed561e92929dce991809180ed56f259607fbfe4d5ea643a6f59';
var owner_id = '-156068934';
album_id = '289433432'
var query =  vkApi + '?&photo_sizes=1&extended=1&album_id=' + album_id
                    + '&access_token=' + access_token
                    + '&count=1000'
                    + '&owner_id=' + owner_id
                    + '&rev=' 
                    /**
                     * Version of VK API
                     */
                    + '&v=5.81&callback=?';

console.log(query)


$.ajax({
    url: query,
    method: 'GET',
    dataType: 'JSONP',
    success: function (data) {
        console.log(data);

        // Loop through all the photos
        for (var i = 0; i < data.response.items.length; i++) {
            var photo = data.response.items[i];
            // Find the photo with the desired size
            var desiredSize = photo.sizes.filter(function(size) {
                return size.type == 'y'; // replace 'x' with the desired size type, for example 'y'
            });

            if (desiredSize.length > 0) {
                // Create a new div for each photo
                var div = $('<div class="col-lg-4 col-sm-6">' +
                            '<div class="singleGal">' +
                                '<div class="galImg">' +
                                    '<img class="galImages" src="" alt="">' +
                                '</div>' +
                                '<div class="galHover">' +
                                    '<div class="galr">' +
                                        '<a href="" class="popUp">' +
                                            '<i class="fa fa-search"></i>' +
                                        '</a>' +
                                        '<a href="#">' +
                                            '<i class="fa fa-info"></i>' +
                                        '</a>' +
                                    '</div>' +
                                    '<h3 class="galTitle">' +
                                        '<a href="#">sadipscing elitr sed diam</a>' +
                                    '</h3>' +
                                    '<p class="galTag">' +
                                        '<a href="#">Battlefield</a>' +
                                    '</p>' +
                                '</div>' +
                            '</div>' +
                        '</div>');

                // Set the src and href attributes for the img and a elements respectively
                div.find('img').attr('src', desiredSize[0].url);
                div.find('a.popUp').attr('href', desiredSize[0].url);

                // Append the div to the container
                $('#coll3Regular').append(div);
            }
        }
    }
});