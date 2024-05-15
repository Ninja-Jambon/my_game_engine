#version 330 core
out vec4 fragColor;

in vec2 fragCoord;
uniform float iTime;
uniform vec2 iResolution;

vec3 palette(float t) {
	vec3 a = vec3(0.898, 1.028, 1.258);
	vec3 b = vec3(0.068, 0.468, 0.500);
	vec3 c = vec3(2.248, 1.298, 0.988);
	vec3 d = vec3(-3.763, -2.553, -0.043);

	return a + b*cos(6.28318*(c*t*d));
}

void main()
{
	vec2 uv = fragCoord;
	uv.x *= iResolution.x / iResolution.y;

	float d = length(uv) - 0.5;

	vec3 col = palette(d + iTime / 3);

	d = sin(d * 8 + iTime) / 8;
	d = abs(d);

	d = 0.02 / d;

	col *= d;

    fragColor = vec4(col, 1);
}