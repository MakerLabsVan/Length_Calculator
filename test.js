var length_calculator = require("./Length Calculator");
var should = require('should');

describe('Get the total length of all lines in svg', function() {
	it('line', function(){
		length_calculator.getFilePathLength("/test_files/line.svg").toFixed(2).should.be.exactly('7.30');
	})
	it('bezier curves', function(){
		length_calculator.getFilePathLength("/test_files/bezier_curve.svg").toFixed(2).should.be.exactly('21.29');
	})
	it('elliptical arcs', function(){
		length_calculator.getFilePathLength("/test_files/elliptical_arc.svg").toFixed(2).should.be.exactly('10.32');
	})
	it('design 1', function(){
		length_calculator.getFilePathLength("/test_files/design1.svg").toFixed(2).should.be.exactly('46.15');
	})
	it('design 2', function(){
		length_calculator.getFilePathLength("/test_files/design2.svg").toFixed(2).should.be.exactly('571.72');
	})
	it('design 3', function(){
		length_calculator.getFilePathLength("/test_files/design3.svg").toFixed(2).should.be.exactly('337.66');
	})
	it('design 4', function(){
		length_calculator.getFilePathLength("/test_files/design4.svg").toFixed(2).should.be.exactly('106.57');
	})
	it('design 5', function(){
		length_calculator.getFilePathLength("/test_files/design5.svg").toFixed(2).should.be.exactly('131.18');
	})
	it('design 6', function(){
		length_calculator.getFilePathLength("/test_files/design6.svg").toFixed(2).should.be.exactly('191.22');
	})
	it('group 1', function(){
		length_calculator.getFilePathLength("/test_files/group1.svg").toFixed(2).should.be.exactly('19.81');
	})
	it('pdf converted to svg', function(){
		length_calculator.getFilePathLength("/test_files/converted_pdf.svg").toFixed(2).should.be.exactly('155.29');
	})
})