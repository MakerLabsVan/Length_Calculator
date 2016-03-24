var LC = require('../helper_methods/length_calculator');
var should = require('should');

describe('Get the total length of all lines in svg', function() {
	it('line', function(){
		var result = LC.getFilePathLength("/test/test_files/line.svg");
		result['#000000'].toFixed(2).should.be.exactly('7.30');
		result['xWidth'].toFixed(2).should.be.exactly('4.92');
		result['yLength'].toFixed(2).should.be.exactly('5.40');
	})
	it('bezier curves', function(){
		var result = LC.getFilePathLength("/test/test_files/bezier_curve.svg");
		result['#000000'].toFixed(2).should.be.exactly('21.29');
		result['xWidth'].toFixed(2).should.be.exactly('5.37');
		result['yLength'].toFixed(2).should.be.exactly('7.22');
	})
	it('elliptical arcs', function(){
		var result = LC.getFilePathLength("/test/test_files/elliptical_arc.svg");
		result['#000000'].toFixed(2).should.be.exactly('10.32');
	})
	it('design 1', function(){
		var result = LC.getFilePathLength("/test/test_files/design1.svg");
		result['#000000'].toFixed(2).should.be.exactly('46.15');
		result['xWidth'].toFixed(2).should.be.exactly('6.07');
		result['yLength'].toFixed(2).should.be.exactly('3.30');
	})
	it('design 2', function(){
		var result = LC.getFilePathLength("/test/test_files/design2.svg");
		result['#000000'].toFixed(2).should.be.exactly('571.72');
	})
	it('design 3', function(){
		var result = LC.getFilePathLength("/test/test_files/design3.svg");
		result['#ff0000'].toFixed(2).should.be.exactly('337.66');
	})
	it('design 4, out of bounds check', function(){
		var result = LC.getFilePathLength("/test/test_files/design4.svg");
		should.not.exist(result['#000000']);
	})
	it('design 5, out of bounds check', function(){
		var result = LC.getFilePathLength("/test/test_files/design5.svg");
		should.not.exist(result['#000000']);
	})
	it('design 6, out of bounds check', function(){
		var result = LC.getFilePathLength("/test/test_files/design6.svg");
		should.not.exist(result['#000000']);
	})
	it('design 7 with scaling', function(){
		var result = LC.getFilePathLength("/test/test_files/design7.svg");
		result['#ff0000'].toFixed(2).should.be.exactly('239.03');
		result['xWidth'].toFixed(2).should.be.exactly('24.57');
		result['yLength'].toFixed(2).should.be.exactly('15.98');
	})
	it('design 8 with scaling', function(){
		var result = LC.getFilePathLength("/test/test_files/design8.svg");
		result['#ff0000'].toFixed(2).should.be.exactly('163.98');
		result['xWidth'].toFixed(2).should.be.exactly('13.00');
		result['yLength'].toFixed(2).should.be.exactly('13.00');
	})
	it('group 1', function(){
		var result = LC.getFilePathLength("/test/test_files/group1.svg");
		result['#000000'].toFixed(2).should.be.exactly('24.74');
		result['xWidth'].toFixed(2).should.be.exactly('3.50');
		result['yLength'].toFixed(2).should.be.exactly('2.66');
	})
	it('pdf converted to svg', function(){
		var result = LC.getFilePathLength("/test/test_files/converted_pdf.svg");
		result['#000000'].toFixed(2).should.be.exactly('155.29');
	})
	it('colours', function(){
		var result = LC.getFilePathLength("/test/test_files/colours.svg");
		result['#000000'].toFixed(2).should.be.exactly('21.29');
		result['#ff0000'].toFixed(2).should.be.exactly('2.19');
		result['#00ff00'].toFixed(2).should.be.exactly('5.91');
	})
	it('opacity', function(){
		var result = LC.getFilePathLength("/test/test_files/opaque.svg");
		result['#ff0000'].toFixed(2).should.be.exactly('2.19');
		should.not.exist(result['#000000']);
		should.not.exist(result['#00ff00']);
	})
	it('jogging1', function(){
		var result = LC.getVectorCost('acryllicClear_6mm', '/test/test_files/jogging1.svg', 'diyMember');
		result.pathLength.toFixed(2).should.be.exactly('20.97');
		result.jogLengthX.toFixed(2).should.be.exactly('8.53');
		result.jogLengthY.toFixed(2).should.be.exactly('1.84');
	})
	it('jogging2', function(){
		var result = LC.getVectorCost('paper', '/test/test_files/jogging1.svg', 'diyMember');
		result.pathLength.toFixed(2).should.be.exactly('10.49');
		result.jogLengthX.toFixed(2).should.be.exactly('5.79');
		result.jogLengthY.toFixed(2).should.be.exactly('1.20');
	})
	it('jogging3', function(){
		var result = LC.getVectorCost('paper', '/test/test_files/bezier_curve.svg', 'diyMember');
		result.pathLength.toFixed(2).should.be.exactly('21.29');
		result.jogLengthX.toFixed(2).should.be.exactly('5.46');
		result.jogLengthY.toFixed(2).should.be.exactly('7.89');
	})
	it('jogging4', function(){
		var result = LC.getVectorCost('acryllicClear_6mm', '/test/test_files/colours.svg', 'diyMember');
		result.pathLength.toFixed(2).should.be.exactly('58.77');
		result.jogLengthX.toFixed(2).should.be.exactly('22.94');
		result.jogLengthY.toFixed(2).should.be.exactly('22.41');
	})
	it('nested transformations', function(){
		var result = LC.getVectorCost('paper', '/test/test_files/1.svg', 'diyMember');
		result.pathLength.toFixed(2).should.be.exactly('229.39');
		result.jogLengthX.toFixed(2).should.be.exactly('8.95');
		result.jogLengthY.toFixed(2).should.be.exactly('91.56');
	})
    it('price test', function(){
		var cost = LC.getVectorCost('balticBirch_3mm', '/test/test_files/bigCut.svg', 'fullService');
		cost.money.toFixed(2).should.be.exactly('88.87');
	})
})