var LC = require('../helper_methods/length_calculator');
var should = require('should');

describe('Get the total length of all lines in svg', function() {
	it('line', function(){
		var map = LC.getFilePathLength("/test/test_files/line.svg");
		map['#000000'].toFixed(2).should.be.exactly('7.30');
		map['xWidth'].toFixed(2).should.be.exactly('4.92');
		map['yLength'].toFixed(2).should.be.exactly('5.40');
	})
	it('bezier curves', function(){
		var map = LC.getFilePathLength("/test/test_files/bezier_curve.svg");
		map['#000000'].toFixed(2).should.be.exactly('21.29');
		map['xWidth'].toFixed(2).should.be.exactly('5.37');
		map['yLength'].toFixed(2).should.be.exactly('7.22');
	})
	it('elliptical arcs', function(){
		var map = LC.getFilePathLength("/test/test_files/elliptical_arc.svg");
		map['#000000'].toFixed(2).should.be.exactly('10.32');
	})
	it('design 1', function(){
		var map = LC.getFilePathLength("/test/test_files/design1.svg");
		map['#000000'].toFixed(2).should.be.exactly('46.15');
		map['xWidth'].toFixed(2).should.be.exactly('6.07');
		map['yLength'].toFixed(2).should.be.exactly('3.30');
	})
	it('design 2', function(){
		var map = LC.getFilePathLength("/test/test_files/design2.svg");
		map['#000000'].toFixed(2).should.be.exactly('571.72');
	})
	it('design 3', function(){
		var map = LC.getFilePathLength("/test/test_files/design3.svg");
		map['#ff0000'].toFixed(2).should.be.exactly('337.66');
	})
	it('design 4, out of bounds check', function(){
		var map = LC.getFilePathLength("/test/test_files/design4.svg");
		should.not.exist(map['#000000']);
	})
	it('design 5, out of bounds check', function(){
		var map = LC.getFilePathLength("/test/test_files/design5.svg");
		should.not.exist(map['#000000']);
	})
	it('design 6, out of bounds check', function(){
		var map = LC.getFilePathLength("/test/test_files/design6.svg");
		should.not.exist(map['#000000']);
	})
	it('design 7 with scaling', function(){
		var map = LC.getFilePathLength("/test/test_files/design7.svg");
		map['#ff0000'].toFixed(2).should.be.exactly('239.03');
		map['xWidth'].toFixed(2).should.be.exactly('24.57');
		map['yLength'].toFixed(2).should.be.exactly('15.98');
	})
	it('design 8 with scaling', function(){
		var map = LC.getFilePathLength("/test/test_files/design8.svg");
		map['#ff0000'].toFixed(2).should.be.exactly('163.98');
		map['xWidth'].toFixed(2).should.be.exactly('13.00');
		map['yLength'].toFixed(2).should.be.exactly('13.00');
	})
	it('group 1', function(){
		var map = LC.getFilePathLength("/test/test_files/group1.svg");
		map['#000000'].toFixed(2).should.be.exactly('24.74');
		map['xWidth'].toFixed(2).should.be.exactly('3.50');
		map['yLength'].toFixed(2).should.be.exactly('2.66');
	})
	it('pdf converted to svg', function(){
		var map = LC.getFilePathLength("/test/test_files/converted_pdf.svg");
		map['#000000'].toFixed(2).should.be.exactly('155.29');
	})
	it('colours', function(){
		var map = LC.getFilePathLength("/test/test_files/colours.svg");
		map['#000000'].toFixed(2).should.be.exactly('21.29');
		map['#ff0000'].toFixed(2).should.be.exactly('2.19');
		map['#00ff00'].toFixed(2).should.be.exactly('5.91');
	})
	it('opacity', function(){
		var map = LC.getFilePathLength("/test/test_files/opaque.svg");
		map['#ff0000'].toFixed(2).should.be.exactly('2.19');
		should.not.exist(map['#000000']);
		should.not.exist(map['#00ff00']);
	})
	it('jogging1', function(){
		var cost = LC.getCost('acryllicClear_6mm', '/test/test_files/jogging1.svg', 'diyMember');
		cost.pathLength.toFixed(2).should.be.exactly('20.97');
		cost.jogLength.toFixed(2).should.be.exactly('8.78');
	})
	it('jogging2', function(){
		var cost = LC.getCost('paper', '/test/test_files/jogging1.svg', 'diyMember');
		cost.pathLength.toFixed(2).should.be.exactly('10.49');
		cost.jogLength.toFixed(2).should.be.exactly('5.96');
	})
	it('jogging3', function(){
		var cost = LC.getCost('paper', '/test/test_files/bezier_curve.svg', 'diyMember');
		cost.pathLength.toFixed(2).should.be.exactly('21.29');
		cost.jogLength.toFixed(2).should.be.exactly('11.65');
	})
	it('jogging4', function(){
		var cost = LC.getCost('acryllicClear_6mm', '/test/test_files/colours.svg', 'diyMember');
		cost.pathLength.toFixed(2).should.be.exactly('58.77');
		cost.jogLength.toFixed(2).should.be.exactly('35.32');
	})
})