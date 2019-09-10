# Nearby Doctors

Proof of concept web application where:

* The user can view nearby doctors
* The user can book an appointment at one of the nearby doctors
* The user receives a confirmation email that the appointment has been accepted 

## Installation

This simple application just requires the code to be cloned from github.
```
git clone https://github.com/jmacdonald263/nearbydoctors.git
```

## Usage

To start open the 'index.html' file, the browser will prompt the user to allow geolocation permissions
* If accepted the map will automatically zoom in to the users location and show markers for nearby doctors.
* If permission is denied the user is prompted for their postcode and once validated also search and show nearby doctors.
* If the user wishes to enter a new postcode, simply edit the contents of the postcode field and click the 'Update' button.

Once the preferred doctor is located and the marker has been selected the details appear in the Appointment Booking section.

Finally the user must enter their details and once completed click the 'Book Appointment' button. This will validate their data and if valid send a confirmation email for the appointment.

## Limitations

Currently the email sending functionality does not send correctly, the code for sending the email is in place, however, the SMTP server does not seem to allow sending due to lack of domain.

## Future Development

If time permitted several aspects would be changed, including but not limited to:

* Improved UI, completion of functionality was favoured over styling.
* Instead of a static HTML page I would have preferred to create a node.js app
* Using require to pull in libraries rather than script tags in the HTML
* Ability to automatically re-search for doctors based on centre of map.