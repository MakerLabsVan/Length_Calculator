describe("Testing Raster Calculations", function () {
	describe("circles3.png", function(){
		it("draws the visualization", function (done){
			testDraw("test_files/circles3.png", function() {
				expect($("#rasterCanvas")[0].height).to.equal(400);
				expect($("#rasterCanvas")[0].width).to.equal(640);
				done();
			});
		});
		it("returns correct verticalDistance", function (){
			expect($("#verticalDistance").text()).to.equal("Vertical distance: 364 pixels"); //currently this is executing before testDraw's event listener finishes running. Fix this.
			
		});
		it("returns correct rasterLength", function (){
			expect($("#rasterLength").text()).to.equal("Optimized raster length: 3814.07 inches");
		});
		it("returns correct time", function (){
			expect($("#rasterTime").text()).to.equal("Actual time: 8.63 minutes");
		});
	});
	describe("circles1.png", function(){
		it("draws the visualization", function (done){
			testDraw("test_files/circles1.png", function() {
				expect($("#rasterCanvas")[0].height).to.equal(400);
				expect($("#rasterCanvas")[0].width).to.equal(640);
				done();
			});
		});
		it("returns correct verticalDistance", function (){
			expect($("#verticalDistance").text()).to.equal("Vertical distance: 279 pixels"); //currently this is executing before testDraw's event listener finishes running. Fix this.
			
		});
		it("returns correct rasterLength", function (){
			expect($("#rasterLength").text()).to.equal("Optimized raster length: 2797.95 inches");
		});
		it("returns correct time", function (){
			expect($("#rasterTime").text()).to.equal("Actual time: 6.43 minutes");
		});
	});
	describe("blank_world_map.svg", function(){
		this.timeout(0);
		it("draws the visualization", function (done){
			testDrawSVG("test_files/blank_world_map.svg", function() {
				expect($("#rasterVisualization")[0].height).to.equal(476);
				expect($("#rasterVisualization")[0].width).to.equal(939);
				done();
			});
		});
		it("returns correct verticalDistance", function (){
			expect($("#verticalDistance").text()).to.equal("Vertical distance: 418 pixels"); //currently this is executing before testDraw's event listener finishes running. Fix this.
			
		});
		it("returns correct rasterLength", function (){
			expect($("#rasterLength").text()).to.equal("Optimized raster length: 12015.76 inches");
		});
		it("returns correct time", function (){
			expect($("#rasterTime").text()).to.equal("Actual time: 21.59 minutes");
		});
	});
	describe("doodle.png", function(){
		it("draws the visualization", function (done){
			testDraw("test_files/doodle.png", function() {
				expect($("#rasterCanvas")[0].height).to.equal(412);
				expect($("#rasterCanvas")[0].width).to.equal(523);
				done();
			});
		});
		it("returns correct verticalDistance", function (){
			expect($("#verticalDistance").text()).to.equal("Vertical distance: 345 pixels"); //currently this is executing before testDraw's event listener finishes running. Fix this.
			
		});
		it("returns correct rasterLength", function (){
			expect($("#rasterLength").text()).to.equal("Optimized raster length: 3072.94 inches");
		});
		it("returns correct time", function (){
			expect($("#rasterTime").text()).to.equal("Actual time: 7.36 minutes");
		});
	});
});