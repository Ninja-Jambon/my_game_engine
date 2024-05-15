#version 330 core
out vec4 fragColor;

in vec2 fragCoord;
uniform float iTime;
uniform vec2 iResolution;
uniform vec2 iMouse;

vec3 palette(float t) {
	vec3 a = vec3(0.821, 0.328, 0.242);
	vec3 b = vec3(0.659, 0.481, 0.896);
	vec3 c = vec3(0.612, 0.340, 0.296);
	vec3 d = vec3(2.820, 3.026, -0.273);

	return a + b*cos(6.28318*(c*t*d));
}

float sdSphere(vec3 p, float s) {
	return length(p) - s;
}

float sdBox(vec3 p, vec3 b) {
	vec3 q = abs(p) - b;
	return length(max(q, 0)) + min(max(q.x, max(q.y, q.z)), 0);
}

float sdOctahedron(vec3 p, float s) {
	p = abs(p);
	return (p.x + p.y + p.z - s) * 0.57735027;
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
	p.z += iTime * .4;

	p.xy = fract(p.xy) - .5;
	p.z = mod(p.z, .25) - .125;

	float box = sdOctahedron(p, .15);

	float ground = p.y + .75;

	return box;
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

	//ro.yz *= rot2D(-m.y);
	//rd.yz *= rot2D(-m.y);

	//ro.xz *= rot2D(-m.x);
	//rd.xz *= rot2D(-m.x);

	// raymarching
	int i;
	for (i = 0; i < 80; i++) {
		vec3 p = ro + rd * t; // position allong the ray

		p.xy *= rot2D(t*.2 * m.x);
		p.y += sin(t*(m.y+1.)*.5)*.35;

		float d = map(p); // current distance to the scene

		t += d;

		if (d < .001 || t > 100) break;
	}

	// Coloring
	col = palette(t*.04 + float(i)* .005);

    fragColor = vec4(col, 1);
}