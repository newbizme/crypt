'use strict';

const User = require('../models').User;
const Role = require("../models").Role;
const Permission = require('../models').Permission;

const createRole = async function (role_name) {

	if(role_name == null) TE("Role name can't be empty");

	let err, role, new_role = {
		name: role_name
	};

	[err, role] = await to(Role.create(new_role));

	if (err) TE(err.message);

	return role;
};
module.exports.createRole = createRole;

const editRole = async function (role_id, updated_role) {
	let err, role = await Role.findById(role_id, {
		include: [Permission]
	});
	if (!role) TE('Role with id %s not found!', role_id);

	// update name if set
	role.name = updated_role.name != null ? updated_role.name : role.name;

	[err, role] = await to(role.save());
	if (err) TE(err.message);

	if(updated_role.permissions != null) {
		let neededPerms;
		[err, neededPerms] = await to(Permission.findAll({
			where: {
				code: updated_role.permissions
			}
		}));

		if (err) TE(err.message);

		let assoc;
		[err, assoc] = await to(role.setPermissions(neededPerms)); // waits until role and permission associations are written into DB.
		
		if (err) TE(err.message);
	}

	return role;
}
module.exports.editRole = editRole;

const deleteRole = async function (role_id) {

	let err, role = await Role.findById(role_id, {
			include: [ User ]
	});
	if (!role) TE("role with id %s not found", role_id);

	if(role.Users.length) TE("Cannot delete role that's currently assigned to users"); 

	[err, role] = await to(role.destroy());
	if (err) TE(err.message);

	return true;
}
module.exports.deleteRole = deleteRole;