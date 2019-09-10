// setup globals for the map and geocoder
var map;
var geocoder;

/* 
 * Function to initialise the map after the google maps library has downloaded
 */
function initMap() {
    // create date picker
    flatpickr("#time", {
        enableTime: true,
        minTime: '09:00', // only between 9-5
        maxTime: '17:00',
        minDate: "today", // no earlier than today
        maxDate: new Date().fp_incr(28), // only allow a month in advance
        disable: [
            function(date) {
                // not saturday or sunday
                return (date.getDay() === 0 || date.getDay() === 6);
            }
        ]
    });

    // init geocoder for postcode to lat/long and vice versa
    geocoder = new google.maps.Geocoder();
    // set glasgow lat long for default on map
    var glasgow = { lat: 55.8597, lng: -4.2550 };
    map = new google.maps.Map(document.getElementById('map'), {
        center: glasgow,
        zoom: 12
    });

    // now see if we can use location permission
    handlePermission();

}

/* 
 * When page is first loaded, ask the user if they wish to give permissions.
 */
function handlePermission() {
    // check if we can have permission to use geolocation
    navigator.permissions.query({ name: 'geolocation' }).then(function(result) {
        if (result.state == 'granted' || result.state == 'prompt') {
            // if we are sucessful get the users current position
            navigator.geolocation.getCurrentPosition(searchForDoctor, positionDenied);
        } else if (result.state == 'denied') {
            // no permission granted, prompt for postcode
            positionDenied();
        }
    });
}

/* 
 * When permissions aren't granted, we need the postcode so prompt for it.
 * Once we get a valid one get the location from this postcode.
 *
 * @param {Object} callbackErr - Error details passed from the permission call
 * @param {String} message - Specific error message to show
 *
 */
function positionDenied(callbackErr, message) {
    // if message is populated, use it in prompt
    var promptMessage = message ? message : 'You have not given location permissions, please enter your postcode.';
    // they have decided not to allow location, prompt for postcode
    var postcode = prompt(promptMessage, 'G2 1AL'); // set glasgow city center as default
    // validate postcode
    if (postcodeValid(postcode)) {
        // was valid, now lookup lat long
        locationFromPostcode(postcode);
    } else {
        // postcode invalid, prompt again
        positionDenied(null, 'That postcode was invalid, use a valid postcode and try again');
    }
}

/* 
 * We have a location, search for nearby doctors.
 *
 * @param {Object} location - Either Lat/Long Object or Location Data
 * @param {Boolean} formattedObj - If populated we already have the formatted object
 *
 */
function searchForDoctor(location, formattedObj) {
    var latlng;
    // if we already have a lat long object
    if (formattedObj) {
        latlng = location;
    } else {
        // create new lat long and also set the postcode on the form
        latlng = new google.maps.LatLng(location.coords.latitude, location.coords.longitude);
        setPostcode('', { lat: location.coords.latitude, lng: location.coords.longitude });
    }

    // move the center of the map to this position and zoom
    map.setCenter(latlng);
    map.setZoom(14);

    // build request object for getting nearby doctors
    var request = {
        location: latlng,
        radius: 3000,
        types: ['doctor']
    };
    // call service to find nearby doctors, use callback for results
    var service = new google.maps.places.PlacesService(map);
    service.nearbySearch(request, placesCallback);
}

/* 
 * Create markers for all doctor locations found
 *
 * @param {Array} results - All Doctors found from places API
 * @param {string} status - Status of the request
 *
 */
function placesCallback(results, status) {
    // if request was successful
    if (status == google.maps.places.PlacesServiceStatus.OK) {
        // loop over all results and create markers
        for (var i = 0; i < results.length; i++) {
            createMarker(results[i]);
        }
    }
}

/* 
 * Create marker and add listener for when it is clicked.
 *
 * @param {Object} place - Details of the current place
 *
 */
function createMarker(place) {
    // create marker for this location
    var placeLoc = place.geometry.location;
    var marker = new google.maps.Marker({
        map: map,
        position: place.geometry.location
    });

    // add listener for when this is clicked
    marker.addListener('click', function() {
        updateSelectedDoctor(place);
    });
}


/* 
 * Set Doctor details when the marker has been clicked.
 *
 * @param {Object} place - Details of the current place
 *
 */
function updateSelectedDoctor(place) {
    document.getElementById('drname').innerText = place.name;
    document.getElementById('vicinity').innerText = place.vicinity;
}


/* 
 * After location is selected and user has entered details, clicking the
 * Book Appointment button will fire this function. Data is validated and
 * if all present will call function to email user details.
 */
function bookAppointment() {
    // first make sure we have selected a doctors
    var drName = document.getElementById('drname').innerText;
    var location = document.getElementById('vicinity').innerText;
    if (!drName) {
        // make sure they selected a marker
        alert('You must select a marker before proceeding.');
        return; // return to stop further execution
    }

    // now check we have populated the user details
    var name = document.getElementById('name').value;
    if (!name) {
        alert('please enter your name before trying again.');
    }
    var email = document.getElementById('email').value;
    if (!email) {
        alert('Please enter a valid email address and try again.');
    } else if (email && !emailIsValid(email)) {
        alert('Email address is invalid, please enter valid email address and try again.');
        return; // return to stop further execution
    }
    var time = document.getElementById('time').value;
    if (!time) {
        alert('Please enter a preferred appointment time');
    }

    // if all are populated and valid
    if (name && email && time) {
        // TODO would put the code to connect to other service and book appoitment here

        // Send email confirmation
        sendEmail(name, email, time, drName, location);
    }

}

/* 
 * Function to send email confiming user details
 *
 * @param {String} name - User's Name
 * @param {String} email - User's Email
 * @param {String} time - Preferred Appointment Time
 * @param {String} drName - Name of the Doctors
 * @param {String} location - Location of the Doctors
 *
 */
function sendEmail(name, email, time, drName, location) {
    // build body of email
    var body = 'Hello ' + name + ',' +
        '\n\nYour appoitment with ' + drName + ' at ' + location +
        ' has been booked for ' + time +
        '\n\nThanks';

    // send email to user
    Email.send({
        SecureToken: '9e8aea6d-3c0a-4643-96d4-337ce2f89661',
        To: email,
        From: "jmacd263@gmail.com",
        Subject: "Appointment Booked",
        Body: body
    }).then(function(message) {
        if(message === 'Failure sending mail.'){
          console.log('Email Error', message);
          // Error TODO
        }else{ 
          alert('Appoitment Booked and Confirmation Email Sent.');
        }
    });
}

/* 
 * Search for the Location Lat/Long
 *
 * @param {String} postcode - The postcode we use to search
 *
 */
function locationFromPostcode(postcode) {
    // set postcode on form
    setPostcode(postcode);
    // search for location from postcode
    geocoder.geocode({ 'address': postcode }, function(results, status) {
        if (status == 'OK') { // if successful
            // search for nearby doctors
            searchForDoctor(results[0].geometry.location, true);
        } else {
            alert('Geocode was not successful for the following reason: ' + status);
        }
    });

}


/* 
 * When the update button is clicked we need to get the current postcode,
 * check if it is valid and if so find the location from this postcode.
 */
function postcodeButton() {
    var postcode = document.getElementById('postcode').value;
    if (postcodeValid(postcode)) {
        // was valid, now lookup lat long
        locationFromPostcode(postcode);
    } else {
        positionDenied(null, 'That postcode was invalid, use a valid postcode and try again');
    }
}

/* 
 * Set the postcode on the form, if the postcode isn't populated we need to
 * find the postcode from the provided location.
 *
 * @param {String} postcode - The Postcode we are setting on form
 * @param {Object} location - The location object if we need to search for postcode
 */
function setPostcode(postcode, location) {
    var postcodeElement = document.getElementById('postcode');
    // if location is populated, we need to search for postcode
    if (location) {
        geocoder.geocode({ 'location': location }, function(results, status) {
            if (status === 'OK') {
                if (results[0]) {
                    // get the postcode from address and set to form
                    postcode = getPostcodeFromAddress(results[0]['address_components']);
                    postcodeElement.value = postcode;
                }
            }
        });
    } else {
        // set postcode to form
        postcodeElement.value = postcode;
    }

}

/* 
 * Loop over address components and find the type that matches 'postal_code',
 * once found return the postcode.
 *
 * @param {Object} address - The Address we are looping over
 * @return {String} - The found postcode
 */
function getPostcodeFromAddress(address) {
    // loop over address components
    for (var i = 0; i < address.length; i++) {
        var component = address[i];
        // check if the type array has postal_code
        for (var j = 0; j < component['types'].length; j++) {
            if (component['types'][j] === 'postal_code') {
                return component['long_name'];
            }
        }
    }
}

/* 
 * Basic postcode validatior
 * @param {String} postcode - The postcode we want to validate
 * @return {Boolean} - True if the postcode is valid
 */
function postcodeValid(postcode) {
    postcode = postcode.replace(/\s/g, "");
    var regex = /^[A-Z]{1,2}[0-9]{1,2}[A-Z]{0,1} ?[0-9][A-Z]{2}$/i;
    return regex.test(postcode);
}

/* 
 * Basic email validatior
 * @param {String} email - The email we want to validate
 * @return {Boolean} - True if the email is valid
 */
function emailIsValid(email) {
    // basic regex validation for email
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}