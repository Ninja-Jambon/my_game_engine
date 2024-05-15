#version 330 core
out vec4 fragColor;
  
in vec2 fragCoord;
uniform float iTime;
uniform vec2 iResolution;

void main()
{
	vec2 uv = fragCoord;
	uv.x *= iResolution.x / iResolution.y;

	float d = length(uv) - 0.5;

	vec3 col = vec3(1, 0, 0);

	d = sin(d * 8 + iTime) / 8;
	d = abs(d);

	d = 0.02 / d;

	col *= d;

    fragColor = vec4(col, 1);
} 