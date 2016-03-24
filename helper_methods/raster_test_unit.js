describe("Testing Raster Calculations", function () {
	describe("circles3.png", function(){
		it("draws the visualization", function (done){
			testDraw("test_files/circles3.png", function() {
				expect($("#canvas")[0].height).to.equal(400);
				expect($("#canvas")[0].width).to.equal(640);
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
			expect($("#time").text()).to.equal("Actual time: 8.63 minutes");
		});
	});
	describe("circles1.png", function(){
		it("draws the visualization", function (done){
			testDraw("test_files/circles1.png", function() {
				expect($("#canvas")[0].height).to.equal(400);
				expect($("#canvas")[0].width).to.equal(640);
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
			expect($("#time").text()).to.equal("Actual time: 6.43 minutes");
		});
	});
	describe("doodle.png", function(){
		it("draws the visualization", function (done){
			testDraw("test_files/doodle.png", function() {
				expect($("#canvas")[0].height).to.equal(412);
				expect($("#canvas")[0].width).to.equal(523);
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
			expect($("#time").text()).to.equal("Actual time: 7.36 minutes");
		});
	});
});