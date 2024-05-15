#include <stdio.h>
#include <stdlib.h>
#include <glad/glad.h>
#include <GLFW/glfw3.h>
#include <stdbool.h>
#include <stdio.h>
#include <math.h>

void framebuffer_size_callback(GLFWwindow* window, int width, int height)
{
	glViewport(0, 0, width, height);
}

void processInput(GLFWwindow *window)
{
	if(glfwGetKey(window, GLFW_KEY_ESCAPE) == GLFW_PRESS)
		glfwSetWindowShouldClose(window, true);
}

char* loadFile(const char* filename) {
    FILE* file = fopen(filename, "rb");
    if (!file) {
        printf("Impossible d'ouvrir le fichier %s\n", filename);
        return NULL;
    }

    fseek(file, 0, SEEK_END);
    long length = ftell(file);
    fseek(file, 0, SEEK_SET);

    char* buffer = (char*)malloc(length + 1);
    fread(buffer, 1, length, file);
    fclose(file);

    buffer[length] = '\0';
    return buffer;
}

int main(int argc, char const *argv[])
{
	// Initialize GLFW
	glfwInit();
	glfwWindowHint(GLFW_CONTEXT_VERSION_MAJOR, 3);
	glfwWindowHint(GLFW_CONTEXT_VERSION_MINOR, 3);
	glfwWindowHint(GLFW_OPENGL_PROFILE, GLFW_OPENGL_CORE_PROFILE);

	// Try to create the window
	GLFWwindow* window = glfwCreateWindow(800, 600, "LearnOpenGL", NULL, NULL);

	if (window == NULL)
	{
		printf("Failed to create GLFW window\n");
		glfwTerminate();
		return -1;
	}

	glfwMakeContextCurrent(window);
	glfwSetFramebufferSizeCallback(window, framebuffer_size_callback);

	// Try to initialize GLAD
	if (!gladLoadGLLoader((GLADloadproc)glfwGetProcAddress))
	{
		printf("Failed to initialize GLAD\n");
		return -1;
	}

	// Define our vertex shader
	const char *vertexShaderSource = loadFile("../shaders/default.vert");

	// Define our frag shader
	const char *fragmentShaderSource = loadFile("../shaders/default.frag");
	
	unsigned int vertexShader;
	vertexShader = glCreateShader(GL_VERTEX_SHADER);
	glShaderSource(vertexShader, 1, &vertexShaderSource, NULL);
	glCompileShader(vertexShader);

	// Check if the shader compilation was successful
	int  success;
	char infoLog[512];
	glGetShaderiv(vertexShader, GL_COMPILE_STATUS, &success);
	if(!success)
	{
	    glGetShaderInfoLog(vertexShader, 512, NULL, infoLog);
	    printf("ERROR::SHADER::VERTEX::COMPILATION_FAILED\n");
	}

	// Create the fragment shader and try to compile it
	unsigned int fragmentShader;
	fragmentShader = glCreateShader(GL_FRAGMENT_SHADER);
	glShaderSource(fragmentShader, 1, &fragmentShaderSource, NULL);
	glCompileShader(fragmentShader);

	// Check if the shader compilation was successful
	glGetShaderiv(fragmentShader, GL_COMPILE_STATUS, &success);
	if(!success)
	{
	    glGetShaderInfoLog(fragmentShader, 512, NULL, infoLog);
	    printf("ERROR::SHADER::FRAGMENT::COMPILATION_FAILED\n");
	}

	// Creating a shader program and combining our shaders into it
	unsigned int shaderProgram;
	shaderProgram = glCreateProgram();
	glAttachShader(shaderProgram, vertexShader);
	glAttachShader(shaderProgram, fragmentShader);
	glLinkProgram(shaderProgram);

	// Check if the linking was successful
	glGetProgramiv(shaderProgram, GL_LINK_STATUS, &success);
	if(!success) {
	    glGetProgramInfoLog(shaderProgram, 512, NULL, infoLog);
	    printf("ERROR::SHADERS::LINKING_FAILED\n");
	}

	// Delete our shaders because we no longer need them
	glDeleteShader(vertexShader);
	glDeleteShader(fragmentShader);

	// Define vertices of a rectangle
	float vertices[] = {
	     1.f,  1.f, 0.f,  // top right
	     1.f, -1.f, 0.f,  // bottom right
	    -1.f, -1.f, 0.f,  // bottom left
	    -1.f,  1.f, 0.f   // top left 
	};
	unsigned int indices[] = {  // note that we start from 0!
	    0, 1, 3,   // first triangle
	    1, 2, 3    // second triangle
	}; 

	// Get the buffer id
	unsigned int VBO, VAO, EBO;
    glGenVertexArrays(1, &VAO);
	glGenBuffers(1, &VBO);
	glGenBuffers(1, &EBO);

	// Bind the vertex array
    glBindVertexArray(VAO);

    // Define the buffer type and send the indices data into the buffer
	glBindBuffer(GL_ELEMENT_ARRAY_BUFFER, EBO);
	glBufferData(GL_ELEMENT_ARRAY_BUFFER, sizeof(indices), indices, GL_STATIC_DRAW);

	// Define the buffer type and send the vertices data into the buffer
	glBindBuffer(GL_ARRAY_BUFFER, VBO);
	glBufferData(GL_ARRAY_BUFFER, sizeof(vertices), vertices, GL_STATIC_DRAW);

	// Describe how to read the vertex data
	glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, 3 * sizeof(float), (void*)0);
	glEnableVertexAttribArray(0);

	// Unbind everything
	glBindBuffer(GL_ARRAY_BUFFER, 0);
    glBindVertexArray(0); 
	glBindBuffer(GL_ELEMENT_ARRAY_BUFFER, 0);

	// Render Loop
	while(!glfwWindowShouldClose(window))
	{

		// input
		processInput(window);

		float timeValue = glfwGetTime();

		int width, height;
	    glfwGetWindowSize(window, &width, &height);

		int iTime = glGetUniformLocation(shaderProgram, "iTime");
		int iResolution = glGetUniformLocation(shaderProgram, "iResolution");

		// Activate the shader program
		glUseProgram(shaderProgram);

		glUniform1f(iTime, timeValue);
		glUniform2f(iResolution, (float)width, (float)height);

		// Draw the rectangle
		glBindVertexArray(VAO);
		glDrawElements(GL_TRIANGLES, 6, GL_UNSIGNED_INT, 0);
		glBindVertexArray(0);

		// check and call events and swap the buffers
		glfwSwapBuffers(window);
		glfwPollEvents();
	}

	glfwTerminate();

	return 0;
}