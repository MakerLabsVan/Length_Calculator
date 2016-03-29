Vector Length Calculator
========================

General
-------
The purpose of this project is to create a website that provides an estimate of the time and money required for a laser cut or raster

The time estimation for laser cutting is based on the total path length of all visible vector lines in the uploaded SVG file, plus the jogging distance of the motor 

The time estimation for rastering is based on the optimized distance that the laser cutter's motor would have to travel

Input: membership status (modifies the cost multiplier), mode (vector cutting or engraving/rastering), material/resolution (depending on mode), and SVG/PNG/JPG file (SVG only for vector cutting mode; SVG/PNG/JPG for engraving/rastering mode)

Output: Total path length, jog length, cost, and time for vector mode; Total raster length, vertical distance, cost, and time for raster mode

Installation
------------
1. Download project from https://github.com/MakerLabsVan/Length_Calculator

2. Install node.js from https://nodejs.org/download/

3. Install dependencies through terminal:
> $ `cd "project folder location"`
>
> $ `npm install`

Usage
-----
To use the website tool:

1. Launch server via terminal:
> $ `cd "project folder location"`
>
> $ `npm start`

2. Type `localhost:3000` in browser's address bar

3. Select options

4. Upload image

5. Click 'Calculate Cost' button

* In the results section, the uploaded image is modified to create a visualization of what is happening. For vector cutting mode, the dotted red lines are the jog lines of the laser cutter. For engraving mode, the greyed area is the area to be rastered.

* Website uses Express framework with ejs templates. Calculations are done client side, with ajax implemented to avoid page refresh.


To use the old command line tool:

1. Open Terminal

2. Change directory to project folder (`$ cd "project folder location"`)

3. Use node to run app (`$ npm start`)

4. Input material

5. Input filepath _inside_ project folder (e.g. If SVG is inside "project folder location"/uploads, type in `/uploads/"SVG file name".svg`). _Do not input full filepath._

6. Input membership status

* Command line tool only has naive raster time estimates. Website tool is recommended instead.

Example of Command Line Tool
----------------------------
> $ `node "project folder location"/helper_methods/length_calculator`
>
> $ prompt: mode: `vector`
>
> $ prompt: material: `paper`
>
> $ prompt: file: `/test/test_files/colours.svg`
>
> $ prompt: membership: `diyMember`
>
> Output:
> { pathLength: 29.38620730744769,
> jogLengthX: 11.845200392900702,
> jogLengthY: 14.610769694597575,
> time: 0.5825450081667319,
> money: 0.5825450081667319,
> jogCoords: 
>  [ [ /a bunch of jog line coordinates/] ] }

Run Tests
---------
Test via website:

* Go to 'localhost:3000/vector_test' for vector testing

* Go to 'localhost:3000/raster_test' for raster testing

Website testing uses mocha.js framework, with chai.js assertion. Tests can be found in '/helper_methods/vector_test_unit.js' and '/helper_methods/raster_test_unit.js' respectively

Test via command line:
> $ `sudo npm install -g mocha`
>
> $ `cd "project folder location"`
>
> $ `mocha`

Command line testing uses mocha.js framework, with should.js assertion. Tests can be found in '/test/vector_test_cmd_line.js'

Settings Configuration
----------------------
Configuration file is located at '/materials_data/materials_data.js'. You can change laser speeds, edit material profiles (material specific settings for cutting speed, power, number of passes etc.), and membership rates/cost multipliers.

Code Organization
-----------------
Vector calculations are done client side, in '/views/vector_data.ejs' with '/helper_methods/bundle.js' (bundle.js is the browserified version of '/helper_methods/vector_calculator.js')

Optimized raster calculations are done client side, in '/views/raster_data_path.ejs' or '/views/raster_data_img.ejs' (depending on whether the file is an SVG or PNG/JPG), with '/helper_methods/raster_calculator.js'

Server code is in 'app.js'

Page routing code is in '/routes' folder

Page views is in '/views' folder

User uploaded images go to '/uploads' folder

To Do
-----
* Add automatic pdf conversion using poppler utils

* Fix potential bug with vector cutting estimations with 'test/test_files/blank_world_map.svg'

History
-------
* Jeremy Ho's 2015 summer and 2016 spring internship project at MakerLabs

License
-------
MIT