Vector Length Calculator
========================

General
-------
The purpose of this project is to provide an estimate of the total length of all visible vector lines in an SVG file. Those results will in turn be used to estimate the total machine time for 2D profiles.

Input: material, SVG filepath, and membership status

Output: length of each set of line colors in inches, jog length, cost, and time

Example
-------
> $ `node "project folder location"/helper_methods/length_calculator`
>
> $ prompt: material: `paper`
>
> $ prompt: file: `/test/test_files/colours.svg`
>
> $ prompt: membership: `diyMember`

Installation
------------
* Download project from https://github.com/MakerLabsVan/Length_Calculator

* Install node.js from https://nodejs.org/download/

* Install dependencies through terminal:

> $ `cd "project folder location"`
>
> $ `npm install`

Usage
-----
To launch app:

1. Open Terminal

2. Change directory to project folder's helper_methods folder (`$ cd "project folder location"/helper_methods`)

3. Use node to run app (`$ node length_calculator`)

4. Input material

5. Input filepath _inside_ project folder (e.g. If SVG is inside "project folder location"/uploads, type in `/uploads/"SVG file name".svg`). _Do not input full filepath._

6. Input membership status

Run Tests
---------
> $ `sudo npm install -g mocha`
>
> $ `cd "project folder location"`
>
> $ `mocha`

Test Website
------------
Launch Server:

> $ `cd "project folder location"`
>
> $ `npm start`

To view website, type `localhost:3000` in URL

Settings Config
---------------
Configuration file is located at "project folder location"/materials_data/materials_data.js. You can change laser speeds, edit material profiles (material specific settings for cutting speed, power, number of passes etc.), and membership rates.

Code Organization
-----------------
All vector calculations are done in helper_methods/length_calculator.js

Naive raster calculations are also done in length_calculator.js

Optimized raster calculations are done client side, in views/raster_data.ejs

Server code is in app.js

Unit testing script is in test/test.js

Page routing code is in routes folder

Page views is in views folder

History
-------
* Jeremy Ho's 2015 summer internship project at MakerLabs

License
-------
MIT