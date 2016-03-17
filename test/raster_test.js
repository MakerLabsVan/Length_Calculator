describe("Testing Rastering Calculations", function () {
	it("draws the visualization", function (){
		testDraw("./test/test_files/circles3.png");
		expect($("#canvas")[0]).to.not.equal(null);
	});
	it("returns correct verticalDistance for circles3.png", function (){
		testDraw("./test/test_files/circles3.png");
		expect($("#verticalDistance").text()).to.equal("Vertical distance: 364 pixels");
		
	});
	it("returns correct rasterlength for circles3.png", function (){
		testDraw("./test/test_files/circles3.png");
		expect($("#rasterlength").text()).to.equal(3814.07);
	});
	it("returns correct time for circles3.png", function (){
		testDraw("./test/test_files/circles3.png");
		expect($("#time").text()).to.equal(8.63);
	});
	it("returns correct cost for circles3.png", function (){
		testDraw("./test/test_files/circles3.png");
		expect($("#cost").text()).to.equal(15);
	});
});