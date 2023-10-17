const mysql = require('mysql2');
const inquirer = require('inquirer');
const sequelize = require('./connection');
const { Department, Role, Employee } = require('./models');
require('dotenv').config();
const db = mysql.createConnection({
    host: 'localhost',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

db.connect((err) => {
    if (err) throw err;
    console.log('Connected to the MySQL database.');
    startApp();
});

function startApp() {
    inquirer
        .prompt({
            type: 'list',
            name: 'action',
            message: 'What would you like to do?',
            choices: [
                'View all departments',
                'View all roles',
                'View all employees',
                'Add a department',
                'Add a role',
                'Add an employee',
                'Update an employee role',
                'Exit',
                ],
    })
    .then((answer) => {
        switch (answer.action) {
            case 'View all departments':
                viewDepartments();
                break;
            case 'View all roles':
                viewRoles();
                break;
            case 'View all employees':
                viewEmployees();
                break;
            case 'Add a department':
                addDepartment();
                break;
            case 'Add a role':
                addRole();
                break;
            case 'Add an employee':
                addEmployee();
                break;
            case 'Update an employee role':
                updateEmployeeRole();
                break;
            case 'Exit':
                db.end();
                console.log('Connection closed.');
                break;
        }
    });
}

function viewDepartments() {
    // Add code to query and display all departments
    const departments = Department.findAll({ raw:true }).then((data) => {
        console.table(data);

        startApp();
    });
};

function viewRoles() {
  // Add code to query and display all roles
    const roles = Role.findAll({ raw: true, include: [{ model: Department}],
    }).then((data) => {
        console.table(
            data.map((role) => {
                return {
                    ...role
                }
            })
        );

        startApp();
    })
}

function viewEmployees() {
    const employees = Employee.findAll({
        raw: true,
        include: [{ model: Role, include: [{ model: Department }] }],
    }).then((data) => {
        const employeeLookup = {};

        for (let i = 0; i < data.length; i++) {
            const employee = data[i];
            employeeLookup[employee.id] =
            employee.first_name + " " + employee.last_name;
        }
        console.table(
            data.map((employee) => {
                return {
                    id: employee.id,
                    first_name: employee.first_name,
                    last_name: employee.last_name,
                    title: employee["Role.title"],
                    department: employee["Role.Department.name"],
                    salary: employee["Role.salary"],
                    manager: employeeLookup[employee.manager_id],
                };
            })
        );
        startApp();
    });
}

function addDepartment() {
  // Add code to prompt for department name and insert it into the database
    inquirer
    .prompt([
        {
        type: "input",
        message: "New Department Name",
        name: "addDepartment",
        },
    ])
    .then((answer) => {
        Department.create({ name: answer.addDepartment }).then((data) => {
        startApp();
        });
    });
}

const addRole = async () => {
    // Add code to prompt for role details and insert them into the database
    const departments = await Department.findAll({
        attributes: [
            ["id", "value"],
            ["name", "name"],
        ],
    });
    const departmentsInfo = departments.map((department) =>
        department.get({ plain: true })
    );
    
    inquirer
        .prompt([
            {
                type: "input",
                message: "New Role Name",
                name: "title",
            },
            {
                type: "input",
                message: "New Role Salary",
                name: "salary",
            },
            {
                type: "list",
                message: "What department would you like to add this new role to?",
                name: "department_id",
                choices: departmentsInfo,
            },
        ])
        .then((answer) => {
            Role.create(answer).then((data) => {
                startApp();
            });
        });
}

const addEmployee = async () => {
  // Add code to prompt for employee details and insert them into the database
    const roles = await Role.findAll({
        attributes: [
            ["id", "value"],
            ["title", "name"],
        ],
    });
    
    rolesInfo = roles.map((role) => role.get({ plain: true }));
    
    let managers = await Employee.findAll({
        attributes: [
            ["id", "value"],
            ["first_name", "name"],
            ["last_name", "lastName"],
        ],
    });
    managers = managers.map((manager) => {
        manager.get({ plain: true });
        const managerInfo = manager.get();
        return {
            name: `${managerInfo.name} ${managerInfo.lastName}`,
            value: managerInfo.value,
        };
    });

    managers.push({ type: "Null Manager", value: null });
        inquirer
        .prompt([
            {
                type: "input",
                message: "Employee's First Name",
                name: "first_name",
            },
            {
                type: "input",
                message: "Employee's Last Name",
                name: "last_name",
            },
            {
                type: "list",
                message: "Employee's Role",
                name: "role_id",
                choices: rolesInfo,
            },
            {
                type: "list",
                message: "Employee's Manager",
                name: "manager_id",
                choices: managers,
            },
        ])
        .then((answer) => {
            Employee.create(answer).then((data) => {
            startApp();
            });
        });
}

const updateEmployeeRole = async () => {
    let employees = await Employee.findAll({
        attributes: [
            ["id", "value"],
            ["first_name", "name"],
            ["last_name", "lastName"],
        ],
    });
    employees = employees.map((employee) => {
        employee.get({ plain: true });
        const employeeInfo = employee.get();
        return {
            name: `${employeeInfo.name} ${employeeInfo.lastName}`,
            value: employeeInfo.value,
        };
    });

    let roles = await Role.findAll({
        attributes: [
            ["id", "value"],
            ["title", "name"],
        ],
    });
    roles = roles.map((role) => role.get({ plain: true }));

    inquirer
        .prompt([
            {
                type: "list",
                message: "Choose the employee being updated",
                name: "id",
                choices: employees,
            },
            {
                type: "list",
                message: "Updated Role Name",
                name: "role_id",
                choices: roles,
            },
        ])
        .then((answer) => {
            Employee.update(answer, {
                where: {
                id: answer.id,
            },
        })
        .then((data) => {
            startApp();
        });
    });
}
