var express = require('express');
var bodyParser = require('body-parser');
var _ = require('underscore');
var db = require('./db.js');
var bcrypt = require('bcrypt');
var middleware = require('./middleware.js')(db);

var app = express();
var PORT = process.env.PORT || 3000;
var todos = [];
var todoNextId = 1;

app.use(bodyParser.json());

app.get('/', function(req, res) {
	res.send('Todo API rppt');
});

//GET /todos?complete=true
app.get('/todos', middleware.requireAuthentication, function(req, res) {
	var query = req.query;
	var where = {};

	if (query.hasOwnProperty('complete') && query.complete === 'true') {
		where.complete = true;
	} else if (query.hasOwnProperty('complete') && query.complete === 'false') {
		where.complete = false;
	}
	if (query.hasOwnProperty('q') && query.q.length > 0) {
		where.description = {
			$like: '%' + query.q + '%'
		};
	}

	db.todo.findAll({where : where}).then (function (todos) {
		res.json(todos);
	}, function (e) {
		res.status(500).send();
	});
	/*
	var filteredTodos = todos;

	if (queryParams.hasOwnProperty('complete') && queryParams.complete === 'true') {
		filteredTodos = _.where(filteredTodos, {complete: true});
	} else if (queryParams.hasOwnProperty('complete') && queryParams.complete === 'false') {
		filteredTodos = _.where(filteredTodos, {complete: false});
	}

	if (queryParams.hasOwnProperty('q') && queryParams.q.length > 0) {
		filteredTodos = _.filter(filteredTodos, function (todo) {
			return todo.description.toLowerCase().indexOf(queryParams.q.toLowerCase()) > -1;
		});
	}

	res.json(filteredTodos);
	*/
});

// GET /todos/:id
app.get('/todos/:id', middleware.requireAuthentication, function(req, res) {
	var todoId = parseInt(req.params.id, 10);
	db.todo.findById(todoId).then(function (todo) {
		if (!!todo) {
			res.json(todo.toJSON());
		} else {
			res.status(404).send();
		}
	}, function (e) {
		res.status(500).send();
	});

	/*
	var matchedTodo = _.findWhere(todos, {id: todoId});
	if (matchedTodo) {
		res.json(matchedTodo);
	} else {
		res.status(404).send();
	}
	*/

});

// POST / todos
app.post('/todos', middleware.requireAuthentication, function(req, res) {
	var body = _.pick(req.body, 'description', 'complete'); //use _.pick to only pick description and complete

	db.todo.create(body).then(function (todo) {
		res.json(todo.toJSON());
	}, function (e) {
		res.status(400).json(e);
	});
	/*
	if (!_.isBoolean(body.complete) || !_.isString(body.description) || body.description.trim().length === 0) {
		return res.status(400).send();
	}

	body.description = body.description.trim();
	//add id field
	body.id = todoNextId++;
	
	// push the body into array
	todos.push(body);

	console.log('description: ' + body.description);
	res.json(body);
	*/
});

// DELETE /todos/:id
app.delete('/todos/:id', middleware.requireAuthentication, function(req, res) {
	var todoId = parseInt(req.params.id, 10);

	db.todo.destroy({
		where: {
			id: todoId
		}
	}).then(function (rowsDeleted) {
		if (rowsDeleted === 0) {
			res.status(404).json({
				error: 'No todo with id'
			});
		} else {
			res.status(204).send();
		}
	}, function (e) {
		res.status(500).send();
	});

	/*
	var matchedTodo = _.findWhere(todos, {id: todoId});

	if (!matchedTodo) {
		res.status(404).json({"error" : "no todo found with that id"});
	} else {
		todos = _.without(todos, matchedTodo);
		res.json(matchedTodo);
	}
	*/
});

// PUT /todos/:id
app.put('/todos/:id', middleware.requireAuthentication, function(req, res) {
	var todoId = parseInt(req.params.id, 10);

	//var matchedTodo = _.findWhere(todos, {id: todoId});
	var body = _.pick(req.body, 'description', 'complete'); 
	var attributes = {};

	/*
	if (!matchedTodo) {
		return res.status(404).send();
	}
	*/

	if (body.hasOwnProperty('complete')) {
		attributes.complete = body.complete;
	}

	if (body.hasOwnProperty('description')) {
		attributes.description = body.description;
	}

	db.todo.findById(todoId).then(function (todo) {
		if (todo) {
			todo.update(attributes).then (function (todo) {
				res.json(todo.toJSON());
			}, function (e) {
				res.status(400).json(e);
			});
		} else {
			res.status(404).send();
		}
	}, function () {
		res.status(500).send();
	});

	/*
	_.extend(matchedTodo, validAttributes);
	res.json(matchedTodo);
	*/
});

app.post('/users', function (req, res) {
	var body = _.pick(req.body, 'email', 'password');
	db.user.create(body).then(function (user) {
		res.json(user.toPublicJSON());
	}, function (e) {
		res.status(400).json(e);
	});
});

// POST /users/Login
app.post('/users/login', function (req, res) {
	var body = _.pick(req.body, 'email', 'password');

	db.user.authenticate(body).then(function (user) {
		var token = user.generateToken('authentication');
		if (token) {
			res.header('Auth', token).json(user.toPublicJSON());
		} else {
			res.status(401).send();
		}
		
	}, function () {
		res.status(401).send();
	});
});

db.sequelize.sync({force: true}).then(function () {
	app.listen(PORT, function() {
		console.log('Express listening on PORT ' + PORT + '!');
	});
});



