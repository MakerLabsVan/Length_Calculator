var length_calculator = require("./Length Calculator");
var should = require('should');

describe('Get the total length of all lines in svg', function() {
	it('line', function(){
		var map = length_calculator.getFilePathLength("/test_files/line.svg");
		map['#000000'].toFixed(2).should.be.exactly('7.30');
		map['xWidth'].toFixed(2).should.be.exactly('4.92');
		map['yLength'].toFixed(2).should.be.exactly('5.40');
	})
	it('bezier curves', function(){
		var map = length_calculator.getFilePathLength("/test_files/bezier_curve.svg");
		map['#000000'].toFixed(2).should.be.exactly('21.29');
		map['xWidth'].toFixed(2).should.be.exactly('5.37');
		map['yLength'].toFixed(2).should.be.exactly('7.22');
	})
	it('elliptical arcs', function(){
		var map = length_calculator.getFilePathLength("/test_files/elliptical_arc.svg");
		map['#000000'].toFixed(2).should.be.exactly('10.32');
	})
	it('design 1', function(){
		var map = length_calculator.getFilePathLength("/test_files/design1.svg");
		map['#000000'].toFixed(2).should.be.exactly('46.15');
		map['xWidth'].toFixed(2).should.be.exactly('6.07');
		map['yLength'].toFixed(2).should.be.exactly('3.30');
	})
	it('design 2', function(){
		var map = length_calculator.getFilePathLength("/test_files/design2.svg");
		map['#000000'].toFixed(2).should.be.exactly('571.72');
	})
	it('design 3', function(){
		var map = length_calculator.getFilePathLength("/test_files/design3.svg");
		map['#ff0000'].toFixed(2).should.be.exactly('337.66');
	})
	it('design 4', function(){
		var map = length_calculator.getFilePathLength("/test_files/design4.svg");
		map['#000000'].toFixed(2).should.be.exactly('106.57');
	})
	it('design 5', function(){
		var map = length_calculator.getFilePathLength("/test_files/design5.svg");
		map['#000000'].toFixed(2).should.be.exactly('131.18');
	})
	it('design 6', function(){
		var map = length_calculator.getFilePathLength("/test_files/design6.svg");
		map['#000000'].toFixed(2).should.be.exactly('191.22');
	})
	it('design 7 with scaling', function(){
		var map = length_calculator.getFilePathLength("/test_files/design7.svg");
		map['#ff0000'].toFixed(2).should.be.exactly('239.03');
		map['xWidth'].toFixed(2).should.be.exactly('24.57');
		map['yLength'].toFixed(2).should.be.exactly('15.98');
	})
	it('design 8 with scaling', function(){
		var map = length_calculator.getFilePathLength("/test_files/design8.svg");
		map['#ff0000'].toFixed(2).should.be.exactly('163.98');
		map['xWidth'].toFixed(2).should.be.exactly('13.00');
		map['yLength'].toFixed(2).should.be.exactly('13.00');
	})
	it('group 1', function(){
		var map = length_calculator.getFilePathLength("/test_files/group1.svg");
		map['#000000'].toFixed(2).should.be.exactly('24.74');
		map['xWidth'].toFixed(2).should.be.exactly('3.50');
		map['yLength'].toFixed(2).should.be.exactly('2.66');
	})
	it('pdf converted to svg', function(){
		var map = length_calculator.getFilePathLength("/test_files/converted_pdf.svg");
		map['#000000'].toFixed(2).should.be.exactly('155.29');
	})
	it('colours', function(){
		var map = length_calculator.getFilePathLength("/test_files/colours.svg");
		map['#000000'].toFixed(2).should.be.exactly('21.29');
		map['#ff0000'].toFixed(2).should.be.exactly('2.19');
		map['#00ff00'].toFixed(2).should.be.exactly('5.91');
	})
	it('opacity', function(){
		var map = length_calculator.getFilePathLength("/test_files/opaque.svg");
		map['#ff0000'].toFixed(2).should.be.exactly('2.19');
		should.not.exist(map['#000000']);
		should.not.exist(map['#00ff00']);
	})
})