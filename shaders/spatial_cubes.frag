#version 330 core
out vec4 fragColor;

in vec2 fragCoord;
uniform float iTime;
uniform vec2 iResolution;
uniform vec2 iMouse;

float sdSphere(vec3 p, float s) {
	return length(p) - s;
}

float sdBox(vec3 p, vec3 b) {
	vec3 q = abs(p) - b;
	return length(max(q, 0)) + min(max(q.x, max(q.y, q.z)), 0);
}

float smin(float a, float b, float k) {
	float h = max(k - abs(a - b), 0.0) / k;
	return min(a, b) - h*h*h*k*(1.0/6.0);
}

mat2 rot2D(float angle) {
	float s = sin(angle);
	float c = cos(angle);
	return mat2(c, -s, s, c);
}

float map(vec3 p) {
	vec3 spherePos = vec3(sin(iTime)*3, 0, 0);
	float sphere = sdSphere(p - spherePos, 1);

	vec3 q = p;

	q = fract(p) - .5;

	q.xy *= rot2D(iTime);

	float box = sdBox(q, vec3(.1));

	float ground = p.y + .75;

	return smin(ground, smin(sphere, box, 2), 1);
}

void main()
{
	vec2 uv = fragCoord;
	uv.x *= iResolution.x / iResolution.y;
	vec2 m = (iMouse * 2 - iResolution) / iResolution.y;

	// init
	vec3 ro = vec3(0, 0, -3);          // ray origin
	vec3 rd = normalize(vec3(uv, 1));  // ray direction
	vec3 col = vec3(0);                // final pixel color

	float t = 0; // total distance travelled

	ro.yz *= rot2D(-m.y);
	rd.yz *= rot2D(-m.y);

	ro.xz *= rot2D(-m.x);
	rd.xz *= rot2D(-m.x);

	// raymarching
	for (int i = 0; i < 80; i++) {
		vec3 p = ro + rd * t; // position allong the ray

		float d = map(p); // current distance to the scene

		t += d;

		if (d < .001 || t > 100) break;
	}

	// Coloring
	col = vec3(t * .07); // Color based on distance

    fragColor = vec4(col, 1);
}