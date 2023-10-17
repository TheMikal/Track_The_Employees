const sequelize = require('../connection');
const Department = require('../models/department');
const Employee = require('../models/employee');
const Role = require('../models/role');

const departmentSeedData = require('./departmentSeedData.json');
const employeeSeedData = require('./employeeSeedData.json');
const roleSeedData = require('./rolesSeedData.json');

const seedDatabase = async () => {

    await sequelize.sync({ force: true });

    const departments = await Department.bulkCreate(departmentSeedData);
    const roles = await Role.bulkCreate(roleSeedData);   
    const employees = await Employee.bulkCreate(employeeSeedData);

    
    process.exit(0);
};

seedDatabase();