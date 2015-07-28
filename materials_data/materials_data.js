//naming convention: material_thicknessUnit. All unites in inches or millimetres
//speed and power are percentages
//maximum speed is around 1 inch/second

//list of material objects
var materials = {
	paper: {passes: 1, speed: 100, power: 100},
	balticBirch_3mm: {passes: 1, speed: 50, power:50},
	acryllicClear_6mm: {passes: 2, speed: 40, power:60}
};

//units in inches/second
var laserSpeed = {maxCutSpeed: 0.92, maxJogSpeedX: 6, maxJogSpeedY: 6.4, maxRasterSpeed: 2};

//units in CAD dollars/minute
var cost = {diyMember: 1, diyPublic: 1.5, fullService: 2, fullServiceRush: 3};

MLV = {};
MLV.materials = materials;
MLV.laserSpeed = laserSpeed;
MLV.cost = cost;