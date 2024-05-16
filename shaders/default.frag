#version 430 core

out vec4 fragColor;

in vec2 fragCoord;
uniform float iTime;
uniform vec2 iResolution;
uniform vec2 iMouse;
uniform vec3 iPlayer;

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

vec2 minId(vec2 a, vec2 b) {
	return (a.x < b.x) ? a : b;
}
vec3 getMaterial(vec3 p, float id) {
	vec3 m;
	switch (int(id)) {
		case 1:
			m = vec3(.9, .9, 0.);
			break;
		case 2:
			m = vec3(0., .5, .5);
			break;
		case 3:
			m = vec3(1, 1, 1);
			break;

		case 10: // Dark brown
			m = vec3(.369, .196, .078);
			break;
		case 11: // Brown
			m = vec3(.49, .376, .302);
			break;
		case 12: // Light brown
			m = vec3(.678, .529, .424);
			break;
		case 13: // Yellow
			m = vec3(.969, .91, .384);
			break;
		case 14: // Light orange
			m = vec3(.969, .78, .384);
			break;
		case 15: // Orange
			m = vec3(.89, .549, .125);
			break;
		case 16: // Red
			m = vec3(.89, .227, .125);
			break;
	}
	return m;
}

vec2 map(vec3 p) {
	int poule[16][16] = {{-1, -1, -1, -1, -1, -1, -1, -1, 10, 10, 10, 10, -1, -1, -1, -1},
						 {-1, -1, -1, -1, -1, -1, -1, -1, 10, 16, 15, 15, 10, -1, -1, -1},
						 {-1, -1, -1, -1, -1, -1, -1, -1, -1, 10, 10, 15, 16, 10, -1, -1},
						 {-1, -1, -1, -1, -1, -1, -1, -1, 10, 11, 12, 12, 12, 11, 10, -1},
						 {-1, 10, 10, -1, -1, -1, -1, -1, 10, 12, 12, 10, 12, 11, 10, -1},
						 {10, 12, 11, 10, 10, -1, -1, -1, 10, 12, 12, 10, 11, 13, 13, 10},
						 {10, 11, 12, 12, 11, 10, 10, 10, 11, 12, 12, 10, 12, 11, 10, -1},
						 {10, 11, 12, 12, 12, 12, 11, 11, 12, 12, 12, 12, 12, 12, 10, -1},
						 {-1, 10, 11, 11, 12, 12, 12, 11, 12, 12, 12, 12, 12, 12, 11, 10},
						 {10, 11, 12, 11, 10, 10, 11, 12, 12, 12, 12, 12, 12, 12, 12, 10},
						 {10, 11, 11, 12, 10, 12, 12, 12, 12, 11, 12, 11, 12, 11, 12, 10},
						 {-1, 10, 11, 11, 11, 10, 10, 10, 10, 11, 11, 12, 11, 12, 12, 10},
						 {-1, -1, 10, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 10, -1},
						 {-1, -1, -1, 10, 10, 11, 10, 11, 11, 11, 11, 11, 10, 10, -1, -1},
						 {-1, -1, -1, -1, -1, 10, 14, 10, 10, 10, 10, 10, -1, -1, -1, -1},
						 {-1, -1, -1, -1, -1, 10, 14, 13, 13, 10, 13, 10, -1, -1, -1, -1}};

	vec2 color = vec2(sdBox(p - vec3(0, 16, 0), vec3(.5)), 1);
	float m = 0;
	for (int i = 15; i >= 0; i--) {
		for (int j = 0; j < 16; j++) {
			if (poule[i][j] != -1) {
				color = minId(color, vec2(sdBox(p - vec3(j, 16 - i, 0), vec3(.5)), poule[i][j]));
			}
		}
	}

	//vec2 box = vec2(sdBox(p, vec3(1)), 1);
	vec2 ground = vec2(p.y + 1, 3);

	return minId(ground, color);
}

vec3 getNormal(vec3 p) {
	vec2 e = vec2(.0001, 0.0);
	vec3 n = vec3(map(p).x) - vec3(map(p - e.xyy).x, map(p - e.yxy).x, map(p - e.yyx).x);
	return normalize(n);
}

vec2 rayMarch(vec3 ro, vec3 rd) {
	vec2 object;

	for (int i = 0; i < 80; i++) {
		vec3 p = ro + rd * object.x; // position allong the ray

		vec2 hit = map(p);
		object.x += hit.x;
		object.y = hit.y;

		if (object.x < .001 || object.x > 100) break;
	}

	return object;
}

vec3 getLight(vec3 p, vec3 rd, vec3 color) {
	vec3 lightPos = vec3(20, 40, -10);
	vec3 L = normalize(lightPos - p);
	vec3 N = getNormal(p);
	vec3 V = -rd;
	vec3 R = reflect(-L, N);

	vec3 specColor = vec3(.5);
	vec3 specular = specColor * pow(clamp(dot(R, V), 0, 1), 10);
	vec3 diffuse = color * clamp(dot(L, N), 0., 1.);
	vec3 ambient = color * .05;
    vec3 fresnel = 0.25 * color * pow(1.0 + dot(rd, N), 3.0);

	// shadows
	float shadow = rayMarch(p + N * 0.02, normalize(lightPos)).x;
	if (shadow < length(lightPos - p)) return ambient + fresnel;

    return diffuse + ambient + specular + fresnel;
}

vec3 render(vec3 ro, vec3 rd) {
	// raymarching
	vec2 object = rayMarch(ro, rd);

	// Coloring
	vec3 col;
	vec3 background = vec3(.52, .80, .92);
	if (object.x < 500) {
		vec3 p = ro + object.x * rd;
		vec3 m = getMaterial(p, object.y);
		col = getLight(p, rd, m);

		// fog
		col = mix(col, background, 1 - exp(-.0008 * object.x * object.x));
	} else {
		col = background - max(0.95 * rd.y, 0);
	}

	// Gamma correction
	col = pow(col, vec3(0.4545));

	return col;
}

void main()
{
	vec2 uv = vec2(fragCoord.x * iResolution.x / iResolution.y, fragCoord.y);

	// Init
	vec3 ro = vec3(0, 0, -3) + iPlayer; // ray origin
	vec3 rd = normalize(vec3(uv, 1));   // ray direction

	// Camera rotations
	rd.yz *= rot2D(-iMouse.y);
	rd.xz *= rot2D(-iMouse.x);

	// Render
	vec3 col = render(ro, rd);

    fragColor = vec4(col, 1);
}