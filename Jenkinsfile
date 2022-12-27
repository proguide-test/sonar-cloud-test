pipeline { 
    environment { 
        root_dirname = '/home/cd-ci/'
        project_name = 'shopping-back-end'
        registry = 'proguidemc/'
        registryCredential = 'docker-hub-proguide' 
        admin_mail = 'mborgo@proguidemc.com'
        dockerImage = ''
        branch_name = ''
        tag_registry = ''
    }
    agent any 
    stages {        
        stage('Getting Project Info') {
            steps {
                script { 
                    registry = registry + project_name
                    
                    if (env.gitlabTargetBranch != null) {
                        branch_name = env.gitlabTargetBranch
                    } else {
                        branch_name = "develop"
                    }
                                                      
                    tag_registry = registry + ":" + branch_name
                }
            }
        }
        stage('Building image') { 
            steps { 
                script { 
                    dockerImage = docker.build tag_registry
                }
            } 
        }
        stage('Pushing image') { 
            steps { 
                script { 
                    docker.withRegistry( '', registryCredential ) { 
                        dockerImage.push() 
                    }
                } 
            }
        } 
        stage('Refreshing app') {
            steps {
				script {
                    def buildDir = root_dirname + branch_name
                    def fileName = buildDir + '/docker-compose.yml'
                    if (fileExists(fileName)) {
                        def data = readYaml file: fileName
                        if (data.services[project_name] != null) {
                            data.services[project_name].image = tag_registry
                            sh "rm $fileName"
                            writeYaml file: fileName, data: data
                            dir(buildDir) {
                                sh "docker-compose up -d"
                            }
                        } else {
                            mail to: admin_mail, subject: 'Jenkins['+registry+']. Compose Error', body: 'El archivo docker-compose en directorio "'+buildDir+'" no contiene un servicio llamado "'+project_name+'"'
                        }  
                    } else {
                        mail to: admin_mail, subject: 'Jenkins['+registry+']. Compose File Error', body: 'El archivo docker-compose no existe en directorio "'+buildDir+'"'
                    }
                    mail to: admin_mail, subject: 'Jenkins['+registry+']. Docker Tag', body: 'Se genero el tag en docker "'+tag_registry+'" para el proyecto "'+project_name+'"' 
				}
			}
		}
    }

    post {
        failure {
            mail to: admin_mail, subject: 'Jenkins['+registry+']. General Error', body: 'Se encontro un fallo ejecutando pipeline'
        }
    }
}
