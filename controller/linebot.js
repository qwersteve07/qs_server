const receiveMessage = async (ctx) => {
	const body = ctx.request.body;
	console.log(body);

	ctx.status = 200;
	ctx.body = { message: "Data received", data: body };
};

export default { receiveMessage };
