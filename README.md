Vector Length Calculator
========================

General
-------
The purpose of this project is to provide an estimate of the total length of all visible vector lines in an SVG file. Those results will in turn be used to estimate the total machine time for 2D profiles.

Input: SVG file, material, and membership status

Output: length of each set of line colors in inches, jog length, cost, and time

Example
-------
In Terminal:

`
> $ node "project folder location"/helper_methods/length_calculator
>
> $ prompt: material: paper
>
> $ prompt: file: /test/test_files/colours.svg
>
> $ prompt: membership: diyMember
`

Installation
------------
Download project from https://github.com/MakerLabsVan/Length_Calculator

Install node.js from https://nodejs.org/download/

Install dependencies through terminal:

`
> $ cd "project folder location"
>
> $ npm install
`

Usage
-----
To launch app:

1. Open Terminal

2. Change directory to project folder's helper_methods folder (`$ cd "project folder location"/helper_methods`)

3. Use node to run app (`$ node length_calculator`)

4. Input material

5. Input filepath _inside_ project folder (e.g. If SVG is inside "project folder location"/uploads, type in `/uploads/"SVG file name".svg`). _Do not input full file path._

6. Input membership status


Run Tests
---------
In Terminal:

`
> $ sudo npm install -g mocha
>
> $ cd "project folder location"
>
> $ mocha
`

History
-------
* Jeremy H's 2015 summer internship project at MakerLabs